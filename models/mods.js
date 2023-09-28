const mongoose = require('mongoose');

const modsch = new mongoose.Schema({
  mod1:  { type: [String], required: true },
  mod2: { type: [String], required: true },
 
});

const mods = mongoose.model('mods', modsch);

module.exports = mods;
