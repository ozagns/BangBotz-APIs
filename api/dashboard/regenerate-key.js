// api/dashboard/regenerate-key.js
import { connectDB } from '../../lib/database.js';
import { verifyToken } from '../../lib/auth.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: false,
      message: 'Method not allowed'
    });
  }

  // Get token from header
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

  try {
    const { db } = await connectDB();
    const users = db.collection('users');

    // Get user
    const user = await users.findOne({ email: payload.email });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found'
      });
    }

    // Generate new API key
    const newApikey = 'bbz-' + crypto.randomBytes(16).toString('hex');

    // Update user
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