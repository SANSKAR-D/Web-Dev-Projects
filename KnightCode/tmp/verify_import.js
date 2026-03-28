const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/api/.env') });

const Topic = require(path.join(__dirname, '../apps/api/models/Problem.model'));

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const topic = await mongoose.connection.useDb('leetcode_problems').collection('topics').findOne({ name: 'Hash Table' });
    if (topic) {
      console.log('Found Hash Table topic');
      const questions = topic.difficulties.flatMap(d => d.questions);
      const lp = questions.find(q => q.title === 'Love percentage');
      if (lp) {
        console.log('--- FOUND QUESTION ---\n');
        console.log('CONSTRAINTS:', lp.constraints);
        console.log('\nDESCRIPTION PREVIEW:');
        console.log(lp.description);
        console.log('\nTEST CASES COUNT:', lp.testCases?.length || 0);
      }
    }
    mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
