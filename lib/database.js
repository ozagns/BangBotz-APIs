// lib/database.js
import { MongoClient } from 'mongodb';

let cachedClient = null;

export async function connectDB() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  cachedClient = client;
  return client;
}

export async function getDB() {
  const client = await connectDB();
  return client.db('bangbotz_db');
}