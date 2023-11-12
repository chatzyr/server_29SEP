const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    ref: 'User',
  },
  recepientId: {
    type: String,
    ref: 'User',
  },
  messageType: {
    type: String,
  },
  message: String,
  timeStamp: {
    type: Date,
    default: Date.now,
  },
  read: { type: Boolean, default: false },
});

const PersonalMessage = mongoose.model('PersonalMessage',messageSchema);

module.exports = PersonalMessage;
