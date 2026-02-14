// lib/database.js
import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

export async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }

  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db('bangbotz_db');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}