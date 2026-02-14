// api/test/db.js
import { connectDB } from '../../lib/database';

export default async function handler(req, res) {
  try {
    const { db } = await connectDB();
    
    // Test: insert dummy data
    const collections = await db.listCollections().toArray();
    
    res.status(200).json({
      status: true,
      message: 'Connected to MongoDB!',
      database: 'bangbotz_db',
      collections: collections.map(c => c.name)
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Failed to connect',
      error: error.message
    });
  }
}