const mongoose = require('mongoose');

const offersch = new mongoose.Schema({
  offercontent: { type: String, required: true },
  bubbles: { type: String, default: "true" } 
 
});

const offer = mongoose.model('Offer', offersch);

module.exports = offer;
