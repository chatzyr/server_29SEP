const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type:{type: String, required: true,default:'none'},
  title: { type: String, required: true },
  image: { type: String, required: true },
  packages: [
    { options: String },
  ],
  Price: [
    { duration: String, price: String },
  ],
});

const PackageModel = mongoose.model('Package', packageSchema);

module.exports = PackageModel;
