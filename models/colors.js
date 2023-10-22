const mongoose = require('mongoose');

const colorSchema = new mongoose.Schema({
    colorsid: { type: String, required: true,unique: true },
    
    vip1: [String],
    vip2: [String],
    vip3: [String],
    vip4: [String]


});

const ColorsModel = mongoose.model('colors', colorSchema);

module.exports = ColorsModel;
