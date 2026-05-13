const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const AuthService = require('../services/AuthService');
const User = require('../models/User.model');
const { protect } = require('../middleware/auth.middleware');
const { loginLimiter, registerLimiter, forgotPasswordLimiter } = require('../middleware/rateLimiter');

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

// @desc    Upload/update user avatar
// @route   PUT /api/auth/avatar
// @access  Private
router.put('/avatar', protect, async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar || typeof avatar !== 'string') {
      return res.status(400).json({ message: 'Avatar data is required' });
    }
    // Validate it's a proper image data URI
    if (!avatar.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Avatar must be a valid image' });
    }
    // Limit avatar size (500KB base64)
    if (avatar.length > 500000) {
      return res.status(400).json({ message: 'Avatar too large. Max 500KB.' });
    }
    await User.updateOne({ _id: req.user._id }, { avatar });
    res.json({ message: 'Avatar updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    
    // Check if the email exists in the database
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email address.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save({ validateBeforeSave: false });

    // Build reset URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"KnightCode" <${process.env.SMTP_EMAIL}>`,
      to: user.email,
      subject: '⚔️ KnightCode — Password Reset Request',
      html: `
        <div style="font-family: Georgia, serif; background: #0D0B09; color: #D4C8A0; padding: 40px; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #3A2E1A;">
          <h2 style="color: #D4A83C; font-family: 'Playfair Display', serif; text-align: center;">⚔️ Password Reset</h2>
          <p style="text-align: center; color: #8A7A5A; font-size: 14px;">A password reset was requested for your KnightCode account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #B8902A, #D4A83C); color: #0D0B09; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; letter-spacing: 1px;">
              Reset Password
            </a>
          </div>
          <p style="color: #6A5A3A; font-size: 13px; text-align: center;">This link expires in 15 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${user.email}`);

    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error. Could not send reset email.' });
  }
});

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Hash the token to compare with DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    // Set new password (pre-save hook will hash it)
    user.passwordHash = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
