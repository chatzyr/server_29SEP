const mongoose = require('mongoose');

const webDetails = new mongoose.Schema({
  id: Number,
  image: String,
  name: String,
  price: Number,
  type: Number,
  //0 vip, 1 merchandise, 2 badges
  description: String
});

const webProducts = mongoose.model('webDetails', webDetails);

module.exports = webProducts;
