const mongoose = require('mongoose');

const detailsSchema = new mongoose.Schema({
  chatzyrCash:{type: String, required:true},
  easyPaisaIBAN: { type: String, required: true },
  IBAN:{type:String},
  supportEmail1: { type: String, required: true },
  supportEmail2: { type: String, required: true },
  PayPalEmail: { type: String, required: true },
  PhoneNumber: { type: String, required: true },
});

const PaymentDetailsModel = mongoose.model('details', detailsSchema);

module.exports = PaymentDetailsModel;
