const express = require('express');
const router = express.Router();
const AuthService = require('../services/AuthService');
const { protect } = require('../middleware/auth.middleware');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', registerLimiter, async (req, res) => {
  const { username, email, password } = req.body;

  // Input validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 30) {
    return res.status(400).json({ message: 'Username must be 3-30 characters' });
  }
  if (!/^[\w.-]+@[\w.-]+\.\w{2,}$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  // Sanitize inputs
  const cleanUsername = username.trim().replace(/[^\w.-]/g, '');

  try {
    const user = await AuthService.registerUser({ username: cleanUsername, email: email.trim().toLowerCase(), password });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await AuthService.loginUser({ email: email.trim().toLowerCase(), password });
    res.json(user);
  } catch (error) {
    // Generic message to prevent user enumeration
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await AuthService.getProfile(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

module.exports = router;
