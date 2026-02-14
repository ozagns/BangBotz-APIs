// api/dashboard.js
import { connectDB } from '../lib/database.js';
import { verifyToken } from '../lib/auth.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: false,
      message: 'Authorization token required'
    });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      status: false,
      message: 'Invalid or expired token'
    });
  }

  const { action } = req.query; // ?action=stats or ?action=regenerate

  if (action === 'regenerate' || req.method === 'POST') {
    return handleRegenerate(req, res, payload);
  } else {
    return handleStats(req, res, payload);
  }
}

// Get Dashboard Stats
async function handleStats(req, res, payload) {
  try {
    const { db } = await connectDB();
    const users = db.collection('users');
    const logs = db.collection('logs');

    const user = await users.findOne({ email: payload.email });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found'
      });
    }

    const usagePercentage = (user.requests / user.limit) * 100;

    const requestHistory = await logs.find({ apikey: user.apikey })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    const endpointStats = {};
    requestHistory.forEach(log => {
      const endpoint = log.endpoint || 'unknown';
      endpointStats[endpoint] = (endpointStats[endpoint] || 0) + 1;
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyUsage = await logs.aggregate([
      {
        $match: {
          apikey: user.apikey,
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    const now = new Date();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    res.status(200).json({
      status: true,
      data: {
        user: {
          username: user.username,
          email: user.email,
          tier: user.tier,
          apikey: user.apikey,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        },
        usage: {
          current: user.requests,
          limit: user.limit,
          remaining: user.limit - user.requests,
          percentage: Math.round(usagePercentage),
          resetDate: resetDate
        },
        stats: {
          totalRequests: requestHistory.length,
          endpointUsage: endpointStats,
          dailyUsage: dailyUsage.map(day => ({
            date: day._id,
            requests: day.count
          }))
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
}

// Regenerate API Key
async function handleRegenerate(req, res, payload) {
  try {
    const { db } = await connectDB();
    const users = db.collection('users');

    const user = await users.findOne({ email: payload.email });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found'
      });
    }

    const newApikey = 'bbz-' + crypto.randomBytes(16).toString('hex');

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          apikey: newApikey,
          updatedAt: new Date()
        }
      }
    );

    res.status(200).json({
      status: true,
      message: 'API key regenerated successfully',
      data: {
        apikey: newApikey,
        oldApikey: user.apikey
      }
    });
  } catch (error) {
    console.error('Regenerate key error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
}