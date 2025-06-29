const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

router.get('/user', async (req, res) => {
  console.log(req.body.email)
  try {
    const user = await User.findOne({email: req.body.email});

    if (!user) throw new Error('User not found');
    
    res.json({ user: user });
  } catch (error) {
    console.log(error)
    res.status(400).json({ error: error.message });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, crypto_salt } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email or username already exists' 
      });
    }
    
    // Create new user
    const user = new User({ 
      username, 
      email, 
      password: password,
      crypto_salt: crypto_salt || null
    });
    
    await user.save();
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    res.status(201).json({ 
      message: 'User registered successfully', 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        offline_credits: user.offline_credits,
        crypto_salt: user.crypto_salt
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user._id);
    
    console.log('Login successful for user:', user.email);
    
    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        offline_credits: user.offline_credits,
        crypto_salt: user.crypto_salt
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;