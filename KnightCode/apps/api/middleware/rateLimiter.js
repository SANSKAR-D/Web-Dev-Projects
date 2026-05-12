const rateLimit = require('express-rate-limit');

// Global default limiter
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict limiter for login (brute force protection)
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts, please try again after a minute.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict limiter for registration (spam prevention)
const registerLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: { message: 'Too many registration attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Limiter for code submission (judge abuse prevention)
const submitLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { message: 'Submission rate limit reached. Please wait before submitting again.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Limiter for code test runner
const runLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 15,
  message: { message: 'Test run rate limit reached. Please wait before running again.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { globalLimiter, loginLimiter, registerLimiter, submitLimiter, runLimiter };
