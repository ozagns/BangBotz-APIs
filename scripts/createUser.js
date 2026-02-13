// scripts/createUser.js
import { MongoClient } from 'mongodb';
import crypto from 'crypto';

async function createUser(username, email, tier = 'free') {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db('bangbotz_db');
  const users = db.collection('users');

  const apikey = 'bbz-' + crypto.randomBytes(16).toString('hex');
  
  await users.insertOne({
    username,
    email,
    apikey,
    tier,
    requests: 0,
    limit: tier === 'free' ? 1000 : tier === 'premium' ? 50000 : 999999999,
    resetMonth: new Date().toISOString().slice(0, 7),
    createdAt: new Date(),
    lastUsed: null
  });

  console.log(`User created!`);
  console.log(`API Key: ${apikey}`);
  
  await client.close();
}

// Usage:
// createUser('testuser', 'test@email.com', 'free');