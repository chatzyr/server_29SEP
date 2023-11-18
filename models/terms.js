const mongoose = require('mongoose');

const terms = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description1: {
    type: String,
    required: true,
  },
  description2: {
    type: String,
    required: true,
  },
});

const TermsAndConds = mongoose.model('TermsAndConds', terms);

module.exports = TermsAndConds;
