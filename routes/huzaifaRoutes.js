const express = require('express');
const mongoose = require("mongoose");
const RoomModel = require('../models/roomsdata'); // Adjust the path as necessary
const User = mongoose.model("User");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Route to like a room
router.post('/like', async (req, res) => {
  // console.log('room like req');
  const { roomId, userEmail } = req.body;
  // console.log(req.body);

  try {
    // Find the room by roomId
    const room = await RoomModel.findOne({ roomId });
    // console.log(room);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if the user has already liked the room
    if (room.likedBy.includes(userEmail)) {
      return res.status(400).json({ message: 'You have already liked this room' });
    }

    // Increment the likes field and add the user's email to likedBy array
    room.likes += 1;
    room.likedBy.push(userEmail);

    // Save the updated room
    await room.save();

    res.status(200).json({ message: 'Room liked successfully', likes: room.likes });
  } catch (error) {
    console.error('Error liking room:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.post("/userData", async (req, res) => {
  // console.log("data");
  try {
    const { email } = req.body;
    // console.log(req.body);
    //validation
    if (!email) {
      return res.status(401).send({
        success: false,
        message: "Please provide email or password",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).send({
        success: false,
        message: "email is not registerd",
      });
    }
    const payload = {
      userId: user._id,
    };
  
    // Generate the token with a secret key and expiration time
    const token = jwt.sign(payload, "Q$r2K6W8n!jCW%Zk", { expiresIn: "3h" });

    return res.status(200).send({
      success: true,
      messgae: "user found",
      user,
      email: {email},
      token,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Login Callcback",
      error,
    });
  }
});

module.exports = router;
