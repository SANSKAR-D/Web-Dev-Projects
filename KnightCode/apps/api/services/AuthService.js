const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const registerUser = async ({ username, email, password }) => {
  // Check if user exists
  const userExists = await User.findOne({ $or: [{ email }, { username }] });

  if (userExists) {
    throw new Error('User already exists');
  }

  // Create user
  // Note: password hashing is handled in the User model pre-save hook
  const user = await User.create({
    username,
    email,
    passwordHash: password,
  });

  if (user) {
    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    };
  } else {
    throw new Error('Invalid user data');
  }
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    };
  } else {
    throw new Error('Invalid email or password');
  }
};

const getProfile = async (userId) => {
  const user = await User.findById(userId).select('-passwordHash');
  if (user) {
    return user;
  } else {
    throw new Error('User not found');
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
};
