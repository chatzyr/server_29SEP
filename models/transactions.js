const mongoose = require('mongoose');

const badgeSchema1 = new mongoose.Schema({
    email: {type: String, default:''},
    transaction_id: { type: String, required: true,unique: true },
    amount: { type: String, required: true },
    time: { type: String, required: true },
    status: {type:String, default:'verified'}
    
});

const trans = mongoose.model('transactions', badgeSchema1);

module.exports = trans;
