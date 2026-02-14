// api/auth/register.js
import { connectDB } from '../../lib/database.js';
import { hashPassword, generateToken } from '../../lib/auth.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: false,
      message: 'Method not allowed'
    });
  }

  const { username, email, password } = req.body;

  // Validation
  if (!username || !email || !password) {
    return res.status(400).json({
      status: false,
      message: 'Username, email, and password are required'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      status: false,
      message: 'Password must be at least 6 characters'
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      status: false,
      message: 'Invalid email format'
    });
  }

  try {
    const { db } = await connectDB();
    const users = db.collection('users');

    // Check if user already exists
    const existingUser = await users.findOne({
      $or: [
        { email: email },
        { username: username }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        status: false,
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken'
      });
    }

    // Generate API key
    const apikey = 'bbz-' + crypto.randomBytes(16).toString('hex');

    // Hash password
    const hashedPassword = hashPassword(password);

    // Create user
    const newUser = {
      username,
      email,
      password: hashedPassword,
      apikey,
      tier: 'free',
      requests: 0,
      limit: 1000,
      resetMonth: new Date().toISOString().slice(0, 7),
      createdAt: new Date(),
      lastLogin: null
    };

    const result = await users.insertOne(newUser);

    // Generate token
    const token = generateToken({
      userId: result.insertedId.toString(),
      email: email,
      username: username,
      tier: 'free'
    });

    res.status(201).json({
      status: true,
      message: 'Registration successful',
      data: {
        token: token,
        user: {
          username: username,
          email: email,
          tier: 'free',
          apikey: apikey
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
}