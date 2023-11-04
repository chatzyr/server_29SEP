const mongoose = require('mongoose');

const coordinateSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  coordinates: [
    {
      email: String,
      x: { type: Number, default: 215 },
      y: { type: Number, default: 125 },
    },
  ],
});

const CoordinateModel = mongoose.model('Coordinate', coordinateSchema);

module.exports = CoordinateModel;
