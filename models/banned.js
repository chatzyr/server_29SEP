const mongoose = require('mongoose');

const bannedsch = new mongoose.Schema({

  banned: { type: [String], required: true },
 
});

const banned = mongoose.model('banned', bannedsch);

module.exports = banned;
