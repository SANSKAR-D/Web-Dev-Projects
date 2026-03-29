const mongoose = require('mongoose');

// Matches the existing leetcode_problems.topics collection schema
const questionSchema = new mongoose.Schema({
  serialNo: Number,
  title: String,
  acceptance: String,
  link: String,
  description: String,
  example: String,
  constraints: [mongoose.Schema.Types.Mixed],
  testCases: [mongoose.Schema.Types.Mixed],
  solution: mongoose.Schema.Types.Mixed,
  timeLimit: { type: Number, default: 1000 },
  memoryLimit: { type: Number, default: 268435456 },
  generatedAt: Date,
}, { _id: true });

const difficultySchema = new mongoose.Schema({
  level: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
  questions: [questionSchema],
}, { _id: true });

const topicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  difficulties: [difficultySchema],
});

// Connect to the 'topics' collection inside the leetcode_problems database
const Topic = mongoose.connection.useDb('leetcode_problems').model('Topic', topicSchema, 'topics');

module.exports = Topic;
