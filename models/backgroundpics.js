const mongoose = require('mongoose');

const backgroundSchema = new mongoose.Schema({
    backgroundID: { type: String, required: true,unique: true },
    
    free: [String],
    vip: [String],
    
});

const badgeModel = mongoose.model('backgroundpics', backgroundSchema);

module.exports = badgeModel;
