const mongoose = require('mongoose');

// Define the ShopItems schema (assuming you have a ShopItems collection)
const shopItemsSchema = new mongoose.Schema({
  // Define the properties of the ShopItems collection
  // ...
});

// Define the ShopDetails schema
const shopDetailsSchema = new mongoose.Schema({
  // Item ID referencing the ShopItems collection
  itemId: {
    type: String,
    
  },
  // Purchase date as a string
  purchasedBy:{type:String,required: true,},
  purchaseDate: {type: String,required: true},
  validtill: {type: String,},

  // Other properties related to shop details
  // ...
});

// Create the ShopDetails model
const ShopDetails = mongoose.model('ShopDetails', shopDetailsSchema);

module.exports = ShopDetails;