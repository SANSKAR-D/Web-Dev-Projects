const mongoose = require('mongoose');
require('dotenv').config({path: '.env'});

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Topic = mongoose.connection.useDb('leetcode_problems').model('Topic', new mongoose.Schema({}, {strict:false}), 'topics');
  const docs = await Topic.find();
  let changedCount = 0;
  for (const doc of docs) {
    let docChanged = false;
    for (const diff of doc.difficulties) {
      const seen = new Set();
      const uniqueQs = [];
      for (const q of diff.questions) {
        if (!seen.has(q.title)) {
          seen.add(q.title);
          uniqueQs.push(q);
        } else {
          docChanged = true;
          console.log('Removed duplicate:', q.title);
        }
      }
      diff.questions = uniqueQs;
    }
    if (docChanged) {
      await Topic.updateOne({_id: doc._id}, {$set: {difficulties: doc.difficulties}});
      changedCount++;
    }
  }
  console.log('Done duplicates check. Docs changed:', changedCount);
  mongoose.disconnect();
}).catch(console.error);
