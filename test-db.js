// test-db.js
import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://ozagns:YOUR_PASSWORD@ozagns.y7qfkpu.mongodb.net/bangbotz_db?appName=ozagns";

async function testConnection() {
  try {
    const client = await MongoClient.connect(uri);
    console.log("✅ Connected to MongoDB!");
    
    const db = client.db('bangbotz_db');
    const collections = await db.listCollections().toArray();
    
    console.log("Collections:", collections);
    
    await client.close();
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  }
}

testConnection();