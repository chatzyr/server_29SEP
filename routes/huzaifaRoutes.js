const express = require('express');
const mongoose = require("mongoose");
const RoomModel = require('../models/roomsdata'); // Adjust the path as necessary
const PicModel = require('../models/backgroundpics');
const User = mongoose.model("User");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Route to like a room
router.post('/like', async (req, res) => {
  // console.log('room like req');
  const { roomId, userEmail } = req.body;
  console.log(req.body);

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
router.post("/fetchPictures", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const pictures = await PicModel
      .aggregate([{ $match: { backgroundID: "123" } }, { $project: { _id: 0 } }])
      .session(session);

    await session.commitTransaction();
    session.endSession();
    res.json(pictures[0]);
    // console.log("PICTURES SENT");
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// router.post("/addPictures", async (req, res) => {
//   const { backgroundID, free, vip } = req.body;
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const newPicture = new PicModel({ backgroundID, free, vip });
//     await newPicture.save({ session });
//     await session.commitTransaction();
//     session.endSession();
//     res.status(201).json({ message: "Pictures added successfully" });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error(error);
//     res.status(500).json({ message: "An error occurred" });
//   }
// });

// Route to update the BackImage of a user
router.put('/updateBackImage', async (req, res) => {
  const { email, backImageUrl } = req.body;

  if (!email || !backImageUrl) {
    return res.status(400).send({ message: 'Email and new BackImage are required' });
  }

  try {
    const user = await User.findOneAndUpdate(
      { email: email },
      { BackImage: backImageUrl },
      { new: true }
    );

    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    res.send({ message: 'BackImage updated successfully', user });
  } catch (error) {
    res.status(500).send({ message: 'Server error', error });
  }
});

// router.get('/balance/:email', async (req, res) => {
//   try {
//     const { email } = req.params.email;
//     console.log(email);
//     // Find the user by email
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Return the user's balance
//     res.status(200).json({ balance: user.balance });
//   } catch (error) {
//     console.error('Error fetching user balance:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

module.exports = router;
