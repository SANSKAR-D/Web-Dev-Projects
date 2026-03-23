const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please fill a valid email address'
    ]
  },
  passwordHash: {
    type: String,
    required: true
  },
  ratings: {
    dsa: { type: Number, default: 0 },
    cp: { type: Number, default: 0 },
    interview: { type: Number, default: 0 },
    contest: { type: Number, default: 0 }
  },
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActiveDate: { type: Date }
  },
  badges: [{ type: String }],
  preferences: {
    language: {
      type: String,
      enum: ['cpp', 'python', 'java', 'js', 'go', 'rust'],
      default: 'cpp'
    },
    theme: {
      type: String,
      enum: ['ancient_codex'],
      default: 'ancient_codex'
    },
    notifications: { type: Boolean, default: true }
  },
  battleCount: { type: Number, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) {
    next();
  }
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Method to match password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
