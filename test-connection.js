// test-connection.js
const { MongoClient } = require('mongodb');

// Copy paste connection string dari .env.local
const uri = "mongodb+srv://bangbotzadmin:BangBotz2025@ozagns.y7qfkpu.mongodb.net/bangbotz_db?retryWrites=true&w=majority";

async function test() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('URI:', uri);
    
    const client = await MongoClient.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('✅ Connected successfully!');
    
    const db = client.db('bangbotz_db');
    const collections = await db.listCollections().toArray();
    
    console.log('📦 Collections:', collections);
    
    await client.close();
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
  }
}

test();