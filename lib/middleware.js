// lib/middleware.js
import { connectDB } from './database.js';

export async function validateApiKey(apikey) {
  if (!apikey) {
    return {
      valid: false,
      message: 'API Key required',
      code: 401
    };
  }

  try {
    const { db } = await connectDB();
    const users = db.collection('users');
    
    const user = await users.findOne({ apikey });
    
    if (!user) {
      return {
        valid: false,
        message: 'Invalid API Key',
        code: 401
      };
    }

    // Check bulan ini
    const currentMonth = new Date().toISOString().slice(0, 7); // "2026-02"
    
    if (user.resetMonth !== currentMonth) {
      // Reset di bulan baru
      await users.updateOne(
        { apikey },
        { 
          $set: { 
            requests: 0, 
            resetMonth: currentMonth 
          } 
        }
      );
      user.requests = 0;
    }

    // Cek quota berdasarkan tier
    const limits = {
      'free': 1000,
      'premium': 50000,
      'vip': 999999999
    };

    if (user.requests >= limits[user.tier]) {
      return {
        valid: false,
        message: `Quota exceeded! Limit: ${limits[user.tier]} requests/month`,
        code: 429
      };
    }

    // Update counter
    await users.updateOne(
      { apikey },
      { 
        $inc: { requests: 1 },
        $set: { lastUsed: new Date() }
      }
    );

    return {
      valid: true,
      user: {
        username: user.username,
        tier: user.tier,
        requests: user.requests + 1,
        limit: limits[user.tier]
      }
    };
  } catch (error) {
    console.error('Validation error:', error);
    return {
      valid: false,
      message: 'Server error',
      code: 500
    };
  }
}

// Rate limiting per menit
const rateLimitMap = new Map();

export function checkRateLimit(apikey, tier) {
  const limits = {
    'free': 10,      // 10 request/menit
    'premium': 60,   // 60 request/menit
    'vip': 9999      // unlimited
  };

  const limit = limits[tier] || 10;
  const now = Date.now();
  const windowMs = 60000; // 1 menit

  const userLimit = rateLimitMap.get(apikey) || { 
    count: 0, 
    resetTime: now + windowMs 
  };

  if (now > userLimit.resetTime) {
    rateLimitMap.set(apikey, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (userLimit.count >= limit) {
    return { 
      allowed: false, 
      remaining: 0,
      resetIn: Math.ceil((userLimit.resetTime - now) / 1000)
    };
  }

  userLimit.count++;
  rateLimitMap.set(apikey, userLimit);
  
  return { 
    allowed: true, 
    remaining: limit - userLimit.count 
  };
}