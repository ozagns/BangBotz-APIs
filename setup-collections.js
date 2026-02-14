// setup-collections.js
import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://bangbotzadmin:BangBotz2025@ozagns.y7qfkpu.mongodb.net/bangbotz_db?appName=ozagns";

async function setupCollections() {
  const client = await MongoClient.connect(uri);
  const db = client.db('bangbotz_db');
  
  // Create collections
  await db.createCollection('users');
  await db.createCollection('logs');
  
  console.log("✅ Collections created!");
  
  // Create index untuk faster query
  await db.collection('users').createIndex({ apikey: 1 });
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  
  console.log("✅ Indexes created!");
  
  await client.close();
}

setupCollections();