const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const Topic = require('./models/Problem.model');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected to MongoDB.");
    const topic = await Topic.findOne({"difficulties.questions.title": "Love percentage"});
    if (!topic) {
        console.log("Not found by title");
        // Try any
        const anyTopic = await Topic.findOne();
        if (anyTopic) {
            console.log(anyTopic.difficulties[0].questions[0].description);
        }
    } else {
        const diff = topic.difficulties.find(d => d.questions.some(q => q.title === "Love percentage"));
        const q = diff.questions.find(q => q.title === "Love percentage");
        console.log("==== START ====");
        console.log(q.description);
        console.log("==== END ====");
    }
    mongoose.connection.close();
  })
  .catch(console.error);
