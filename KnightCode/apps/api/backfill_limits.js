require('dotenv').config({path: '.env'});
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const Topic = require('./models/Problem.model.js');
    console.log('Connected to MongoDB. Starting backfill with updateMany...');

    // We do a raw bulk update across all topics to safely populate the missing fields
    const result = await Topic.updateMany(
      {},
      { 
        $set: { 
          'difficulties.$[].questions.$[q1].timeLimit': 1000,
          'difficulties.$[].questions.$[q1].memoryLimit': 268435456
        } 
      },
      {
        arrayFilters: [{ 'q1.timeLimit': { $exists: false } }]
      }
    );

    console.log(`Successfully backfilled limits. Modified ${result.modifiedCount} topic documents.`);
    
    // Also catch questions where it might be present but memoryLimit is missing
    const result2 = await Topic.updateMany(
      {},
      { 
        $set: { 
          'difficulties.$[].questions.$[q2].memoryLimit': 268435456
        } 
      },
      {
        arrayFilters: [{ 'q2.memoryLimit': { $exists: false } }]
      }
    );
    console.log(`Second pass for memory limits. Modified ${result2.modifiedCount} topic documents.`);

    mongoose.disconnect();
  } catch (err) {
    console.error('Error during backfill:', err);
    mongoose.disconnect();
  }
});
