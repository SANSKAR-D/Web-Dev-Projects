require('dotenv').config();
const mongoose = require('mongoose');

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI missing in .env");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    
    const Topic = mongoose.connection.useDb('leetcode_problems').model('Topic', new mongoose.Schema({}, { strict: false }), 'topics');

    const topic = 'Array';
    const level = 'Easy';
    
    const curr = Date.now();
    const curr2 = Date.now();
    const doc = await Topic.findOne(
      { name: topic, 'difficulties.level': level },
      { 'difficulties.$': 1 }
    ).select('-difficulties.questions.solution -difficulties.questions.testCases -difficulties.questions.description -difficulties.questions.constraints').lean();
    
    // Sort in JS
    const sorted = [...(doc?.difficulties[0]?.questions || [])].sort((a, b) => {
      const aVal = parseFloat(a.acceptance) || 0;
      const bVal = parseFloat(b.acceptance) || 0;
      return bVal - aVal;
    });

    console.log(`findOne+JS Sort took ${Date.now() - curr2}ms, returned ${sorted.length} items.`);
    if (sorted.length > 0) {
      console.log('First:', sorted[0]);
      console.log('Last:', sorted[sorted.length - 1]);
    }
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    mongoose.disconnect();
  });
