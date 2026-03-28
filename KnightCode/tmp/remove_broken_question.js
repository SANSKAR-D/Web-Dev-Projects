const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/api/.env') });

const Topic = require(path.join(__dirname, '../apps/api/models/Problem.model'));

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const topicName = 'Hash Table';
    const topicDoc = await mongoose.connection.useDb('leetcode_problems').collection('topics').findOne({ name: topicName });
    if (topicDoc) {
      console.log('Found Hash Table topic');
      let modified = false;

      // Filter out all "Love percentage" questions so we can freshly insert it
      const newDifficulties = topicDoc.difficulties.map(d => {
        const filteredQuestions = d.questions.filter(q => q.title !== 'Love percentage');
        if (filteredQuestions.length !== d.questions.length) {
          modified = true;
          console.log(`Removed ${d.questions.length - filteredQuestions.length} "Love percentage" from ${d.level}`);
        }
        return { ...d, questions: filteredQuestions };
      });

      if (modified) {
        await mongoose.connection.useDb('leetcode_problems').collection('topics').updateOne(
          { name: topicName },
          { $set: { difficulties: newDifficulties } }
        );
        console.log('Cleaned up broken question from DB.');
      }
    }
    mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
