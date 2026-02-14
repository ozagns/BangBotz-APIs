// api/auth.js
import { connectDB } from '../lib/database.js';
import { comparePassword, hashPassword, generateToken } from '../lib/auth.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: false,
      message: 'Method not allowed'
    });
  }

  const { action } = req.query; // ?action=login or ?action=register

  if (action === 'login') {
    return handleLogin(req, res);
  } else if (action === 'register') {
    return handleRegister(req, res);
  } else {
    return res.status(400).json({
      status: false,
      message: 'Invalid action. Use ?action=login or ?action=register'
    });
  }
}

// Login Handler
async function handleLogin(req, res) {
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

    if (!user.password) {
      return res.status(401).json({
        status: false,
        message: 'Please set your password first. Contact support.'
      });
    }

    if (!comparePassword(password, user.password)) {
      return res.status(401).json({
        status: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      tier: user.tier
    });

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

// Register Handler
async function handleRegister(req, res) {
  const { username, email, password } = req.body;

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

    const apikey = 'bbz-' + crypto.randomBytes(16).toString('hex');
    const hashedPassword = hashPassword(password);

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