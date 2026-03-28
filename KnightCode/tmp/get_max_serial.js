const mongoose = require('mongoose');
const Topic = require('./apps/api/models/Problem.model');
require('dotenv').config({ path: path.join(__dirname, '../apps/api/.env') });

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const result = await mongoose.connection.useDb('leetcode_problems').collection('topics').aggregate([
      { $unwind: '$difficulties' },
      { $unwind: '$difficulties.questions' },
      { $group: { _id: null, maxSerial: { $max: '$difficulties.questions.serialNo' } } }
    ]).toArray();
    console.log(JSON.stringify(result));
    mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
