const express = require('express');
const router = express.Router();
const Topic = require('../models/Problem.model');
const mongoose = require('mongoose');
const User = require('../models/User.model');
const { optionalProtect, adminProtect, protect } = require('../middleware/auth.middleware');
const { submitLimiter, runLimiter, leaderboardLimiter } = require('../middleware/rateLimiter');

const ALLOWED_LANGUAGES = ['cpp', 'python', 'javascript'];
const MAX_CODE_LENGTH = 50000; // 50KB

// @desc    Get questions by topic name and difficulty level
// @route   GET /api/problems?topic=Hash Table&difficulty=Easy
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { topic, difficulty } = req.query;

    if (!topic || !difficulty) {
      return res.status(400).json({ message: 'topic and difficulty query params are required' });
    }

    // Capitalize first letter to match DB format (Easy, Medium, Hard)
    const level = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();

    const topicDoc = await Topic.findOne(
      { name: topic, 'difficulties.level': level },
      { 'difficulties.$': 1 }
    ).lean();

    if (!topicDoc || !topicDoc.difficulties || topicDoc.difficulties.length === 0) {
      return res.json([]);
    }

    const questions = topicDoc.difficulties[0].questions || [];

    // Sort questions by acceptance descending and strip heavy fields
    // Override acceptance to '0%' for questions with no real submissions (legacy dummy data)
    const sorted = questions.map(q => ({
      _id: q._id,
      serialNo: q.serialNo,
      title: q.title,
      acceptance: (!q.totalSubmissions || q.totalSubmissions === 0) ? '0%' : q.acceptance,
      link: q.link
    })).sort((a, b) => {
      const aVal = parseFloat(a.acceptance) || 0;
      const bVal = parseFloat(b.acceptance) || 0;
      return bVal - aVal;
    });

    res.json(sorted);
  } catch (error) {
    console.error('Problems route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get all topic names
// @route   GET /api/problems/topics
// @access  Public
router.get('/topics', async (req, res) => {
  try {
    const topics = await Topic.find({}, 'name');
    res.json(topics.map(t => t.name));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get single question full details by _id
// @route   GET /api/problems/question?id=<_id>&topic=...&difficulty=...
// @access  Public
router.get('/question', optionalProtect, async (req, res) => {
  try {
    const { id, topic, difficulty } = req.query;

    if (!id || !topic || !difficulty) {
      return res.status(400).json({ message: 'id, topic, and difficulty are required' });
    }

    const level = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();

    const topicDoc = await Topic.findOne(
      { name: topic, 'difficulties.level': level },
      { 'difficulties.$': 1 }
    ).lean();

    if (!topicDoc || !topicDoc.difficulties || topicDoc.difficulties.length === 0) {
      return res.status(404).json({ message: 'Topic or difficulty not found' });
    }

    const questions = topicDoc.difficulties[0].questions || [];
    const question = questions.find(q => q._id.toString() === id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const isAdmin = req.user && req.user.email === 'sanskar.20253248@mnnit.ac.in';
    const safeQuestion = JSON.parse(JSON.stringify(question));
    
    if (!isAdmin && safeQuestion.testCases) {
      safeQuestion.testCases = safeQuestion.testCases.map(tc => {
        if (tc.hidden) {
          return { ...tc, input: 'Hidden', expectedOutput: 'Hidden' };
        }
        return tc;
      });
    }

    res.json(safeQuestion);
  } catch (error) {
    console.error('Question route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update question details (Admin only)
// @route   PUT /api/problems/question
// @access  Private Admin
router.put('/question', adminProtect, async (req, res) => {
  try {
    const { id, topic, difficulty, updates } = req.body;
    if (!id || !topic || !difficulty || !updates) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const level = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();

    const setUpdates = {};
    for (const key in updates) {
      setUpdates[`difficulties.$[diff].questions.$[quest].${key}`] = updates[key];
    }

    const updatedTopic = await Topic.findOneAndUpdate(
      { name: topic, 'difficulties.level': level, 'difficulties.questions._id': id },
      { $set: setUpdates },
      {
        arrayFilters: [{ 'diff.level': level }, { 'quest._id': id }],
        new: true
      }
    );

    if (!updatedTopic) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({ message: 'Question updated successfully' });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Delete a question (Admin only)
// @route   DELETE /api/problems/question
// @access  Private Admin
router.delete('/question', adminProtect, async (req, res) => {
  try {
    const { id, topic, difficulty } = req.query;
    if (!id || !topic || !difficulty) {
      return res.status(400).json({ message: 'Missing required query parameters' });
    }

    const level = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();

    const updatedTopic = await Topic.findOneAndUpdate(
      { name: topic, 'difficulties.level': level },
      { $pull: { 'difficulties.$.questions': { _id: id } } },
      { new: true }
    );

    if (!updatedTopic) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const executor = require('../judge/executor');

// Debounced acceptance percentage recalculation
// Groups rapid submissions and only writes the acceptance string once per 5 seconds per question
const acceptanceTimers = new Map();
const scheduleAcceptanceUpdate = (topicName, level, questionId) => {
  const key = `${topicName}_${level}_${questionId}`;
  if (acceptanceTimers.has(key)) clearTimeout(acceptanceTimers.get(key));
  
  acceptanceTimers.set(key, setTimeout(async () => {
    acceptanceTimers.delete(key);
    try {
      const qObjectId = new mongoose.Types.ObjectId(questionId);
      const doc = await Topic.findOne(
        { name: topicName, 'difficulties.level': level },
        { 'difficulties.$': 1 }
      ).lean();
      if (!doc || !doc.difficulties?.[0]) return;
      const q = doc.difficulties[0].questions.find(q => q._id.toString() === questionId);
      if (!q || !q.totalSubmissions) return;

      const pct = ((q.acceptedSubmissions / q.totalSubmissions) * 100).toFixed(1) + '%';
      await Topic.updateOne(
        { name: topicName, 'difficulties.level': level, 'difficulties.questions._id': qObjectId },
        { $set: { 'difficulties.$[diff].questions.$[quest].acceptance': pct } },
        { arrayFilters: [{ 'diff.level': level }, { 'quest._id': qObjectId }] }
      );
    } catch (err) {
      console.error('Acceptance recalculation error:', err);
    }
  }, 5000));
};

// @desc    Run custom test cases for a question
// @route   POST /api/problems/run
// @access  Public
router.post('/run', runLimiter, async (req, res) => {
  try {
    const { language, code, testCases } = req.body;

    if (!language || !code || !Array.isArray(testCases)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!ALLOWED_LANGUAGES.includes(language)) {
      return res.status(400).json({ message: 'Unsupported language' });
    }
    if (typeof code !== 'string' || code.length > MAX_CODE_LENGTH) {
      return res.status(400).json({ message: `Code must be under ${MAX_CODE_LENGTH / 1000}KB` });
    }
    if (testCases.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 custom test cases allowed' });
    }

    const result = await executor.runCustom(language, code, testCases);
    res.json(result);
  } catch (error) {
    console.error('Run route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// @desc    Submit solution for a question
// @route   POST /api/problems/submit
// @access  Public (optionally authenticated)
router.post('/submit', submitLimiter, optionalProtect, async (req, res) => {
  try {
    const { id, topic, difficulty, language, code } = req.body;

    if (!id || !topic || !difficulty || !language || !code) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!ALLOWED_LANGUAGES.includes(language)) {
      return res.status(400).json({ message: 'Unsupported language' });
    }
    if (typeof code !== 'string' || code.length > MAX_CODE_LENGTH) {
      return res.status(400).json({ message: `Code must be under ${MAX_CODE_LENGTH / 1000}KB` });
    }

    const level = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();

    const topicDoc = await Topic.findOne(
      { name: topic, 'difficulties.level': level },
      { 'difficulties.$': 1 }
    ).lean();

    if (!topicDoc || !topicDoc.difficulties || topicDoc.difficulties.length === 0) {
      return res.status(404).json({ message: 'Topic or difficulty not found' });
    }

    const questions = topicDoc.difficulties[0].questions || [];
    const question = questions.find(q => q._id.toString() === id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Run the judge
    const result = await executor.judge(question, language, code);
    
    // Update acceptance percentage counters
    const isAccepted = result.overallStatus === 'Accepted';
    const questionObjectId = new mongoose.Types.ObjectId(id);
    const incFields = { 'difficulties.$[diff].questions.$[quest].totalSubmissions': 1 };
    if (isAccepted) {
      incFields['difficulties.$[diff].questions.$[quest].acceptedSubmissions'] = 1;
    }

    await Topic.updateOne(
      { name: topic, 'difficulties.level': level, 'difficulties.questions._id': questionObjectId },
      { $inc: incFields },
      { arrayFilters: [{ 'diff.level': level }, { 'quest._id': questionObjectId }] }
    );

    // Debounced acceptance recalculation (5 second delay per question)
    scheduleAcceptanceUpdate(topic, level, id);

    // If accepted and user is logged in, update their solved count (dedup)
    if (isAccepted && req.user) {
      const questionKey = `${topic}_${difficulty}_${id}`;
      const diffKey = `solvedByDifficulty.${level.toLowerCase()}`;
      
      // Always record submission date for heatmap
      await User.updateOne(
        { _id: req.user._id },
        { $push: { submissionDates: { $each: [new Date()], $slice: -365 } } }
      );

      // Increment solve count only for first-time solves (dedup)
      await User.updateOne(
        { _id: req.user._id, solvedQuestionIds: { $ne: questionKey } },
        {
          $inc: { questionsSolved: 1, [diffKey]: 1 },
          $push: { solvedQuestionIds: questionKey }
        }
      );
    }

    res.json(result);
  } catch (error) {
    console.error('Submission route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get top 10 users by questions solved
// @route   GET /api/problems/leaderboard
// @access  Public
let leaderboardCache = { data: null, timestamp: 0 };
const LEADERBOARD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

router.get('/leaderboard', leaderboardLimiter, async (req, res) => {
  try {
    const now = Date.now();
    if (leaderboardCache.data && (now - leaderboardCache.timestamp) < LEADERBOARD_CACHE_TTL) {
      return res.json(leaderboardCache.data);
    }

    const leaders = await User.find({}, 'username questionsSolved createdAt')
      .sort({ questionsSolved: -1 })
      .limit(10)
      .lean();

    leaderboardCache = { data: leaders, timestamp: now };
    res.json(leaders);
  } catch (error) {
    console.error('Leaderboard route error:', error);
    // Serve stale cache if DB fails
    if (leaderboardCache.data) return res.json(leaderboardCache.data);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
