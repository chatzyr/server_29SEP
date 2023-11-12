const mongoose = require('mongoose');

const custom = new mongoose.Schema({
    userid: { type: String, required: true,unique: true },
    
    badges: [String],
    colors: [String],
    
});

const CustomModel = mongoose.model('custom', custom);

module.exports = CustomModel;
