// api/auth/login.js
import { connectDB } from '../../lib/database.js';
import { comparePassword, generateToken } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: false,
      message: 'Method not allowed'
    });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: false,
      message: 'Email and password are required'
    });
  }

  try {
    const { db } = await connectDB();
    const users = db.collection('users');

    // Find user by email or username
    const user = await users.findOne({
      $or: [
        { email: email },
        { username: email }
      ]
    });

    if (!user) {
      return res.status(401).json({
        status: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user has password (some users might only have API key)
    if (!user.password) {
      return res.status(401).json({
        status: false,
        message: 'Please set your password first. Contact support.'
      });
    }

    // Verify password
    if (!comparePassword(password, user.password)) {
      return res.status(401).json({
        status: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      tier: user.tier
    });

    // Update last login
    await users.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    res.status(200).json({
      status: true,
      message: 'Login successful',
      data: {
        token: token,
        user: {
          username: user.username,
          email: user.email,
          tier: user.tier,
          apikey: user.apikey
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
}