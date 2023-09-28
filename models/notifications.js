const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  recipient: { type: String, required: true },
  message: { type: String, required: true },
  type:{type: String, default:'default'},
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  pic:{type: String, default:'https://cdn-icons-png.flaticon.com/512/3177/3177440.png'},
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;