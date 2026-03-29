require('dotenv').config({path: '.env'});
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const Topic = require('./models/Problem.model.js');
        const docs = await Topic.find();
        
        let target;
        for(const d of docs) {
            for(const dif of d.difficulties) {
                if(dif.questions && dif.questions.length > 0) {
                    target = { name: d.name, level: dif.level, id: dif.questions[0]._id.toString(), title: dif.questions[0].title, originalDesc: dif.questions[0].description };
                    break;
                }
            }
            if (target) break;
        }

        if(!target) return console.log("No questions found");
        console.log("Target:", target.name, target.level, target.id);

        const updated1 = await Topic.findOneAndUpdate(
            { name: target.name, 'difficulties.level': target.level, 'difficulties.questions._id': target.id },
            { '$set': { 'difficulties.$[diff].questions.$[quest].description': target.originalDesc + ' test1' } },
            { arrayFilters: [{ 'diff.level': target.level }, { 'quest._id': target.id }], new: true }
        );
        let s = false;
        if(updated1) {
          for(const d of updated1.difficulties) if(d.level === target.level) s = d.questions.find(q=>q._id.toString()===target.id).description.includes('test1');
        }
        console.log('Update with String ID returned object?', !!updated1, 'Did it really update?', s);
        
        const updated2 = await Topic.findOneAndUpdate(
            { name: target.name, 'difficulties.level': target.level, 'difficulties.questions._id': target.id },
            { '$set': { 'difficulties.$[diff].questions.$[quest].description': target.originalDesc + ' test2' } },
            { arrayFilters: [{ 'diff.level': target.level }, { 'quest._id': new mongoose.Types.ObjectId(target.id) }], new: true }
        );
        let s2 = false;
        if(updated2) {
          for(const d of updated2.difficulties) if(d.level === target.level) s2 = d.questions.find(q=>q._id.toString()===target.id).description.includes('test2');
        }
        console.log('Update with ObjectId returned object?', !!updated2, 'Did it really update?', s2);

        mongoose.disconnect();
    } catch(e) {
        console.error(e);
        mongoose.disconnect();
    }
});
