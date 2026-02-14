// scripts/createUser.js
import dotenv from 'dotenv';
import { connectDB } from '../lib/database.js';
import crypto from 'crypto';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function createUser(username, email, tier = 'free') {
  try {
    // Debug: cek environment variable
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in .env.local');
      process.exit(1);
    }

    console.log('🔄 Connecting to database...');
    
    const { db } = await connectDB();
    const users = db.collection('users');

    // Cek apakah email sudah ada
    const existing = await users.findOne({ email });
    if (existing) {
      console.log('❌ Email already exists!');
      process.exit(1);
    }

    // Generate API key
    const apikey = 'bbz-' + crypto.randomBytes(16).toString('hex');
    
    const limits = {
      'free': 1000,
      'premium': 50000,
      'vip': 999999999
    };

    // Insert user
    await users.insertOne({
      username,
      email,
      apikey,
      tier,
      requests: 0,
      limit: limits[tier],
      resetMonth: new Date().toISOString().slice(0, 7),
      createdAt: new Date(),
      lastUsed: null
    });

    console.log('✅ User created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Username:', username);
    console.log('Email:', email);
    console.log('Tier:', tier);
    console.log('API Key:', apikey);
    console.log('Limit:', limits[tier], 'requests/month');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Ambil arguments dari command line
const args = process.argv.slice(2);
const username = args[0];
const email = args[1];
const tier = args[2] || 'free';

if (!username || !email) {
  console.log('Usage: node scripts/createUser.js <username> <email> [tier]');
  console.log('Example: node scripts/createUser.js testuser test@email.com free');
  process.exit(1);
}

createUser(username, email, tier);