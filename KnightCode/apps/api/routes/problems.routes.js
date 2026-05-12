const express = require('express');
const router = express.Router();
const Topic = require('../models/Problem.model');
const User = require('../models/User.model');
const { optionalProtect, adminProtect, protect } = require('../middleware/auth.middleware');
const { submitLimiter, runLimiter } = require('../middleware/rateLimiter');

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

    // Sort questions by acceptance descending (acceptance is stored as "55.8%") and strip heavy fields
    const sorted = questions.map(q => ({
      _id: q._id,
      serialNo: q.serialNo,
      title: q.title,
      acceptance: q.acceptance,
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

const executor = require('../judge/executor');

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
    
    // If accepted and user is logged in, update their solved count (dedup)
    if (result.overallStatus === 'Accepted' && req.user) {
      const questionKey = `${topic}_${difficulty}_${id}`;
      await User.updateOne(
        { _id: req.user._id, solvedQuestionIds: { $ne: questionKey } },
        {
          $inc: { questionsSolved: 1 },
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

router.get('/leaderboard', async (req, res) => {
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
