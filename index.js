const { Mutex } = require("async-mutex");
const axios = require("axios");
const roomMutex = new Mutex();
const express = require("express"),
  mongoose = require("mongoose"),
  bodyParser = require("body-parser"),
  moment = require("moment-timezone"),
  cors = require("cors"),
  WebSocket = require("ws"),
  http = require("http"),
  app = express(),
  PORT = process.env.PORT || 4000;
const jwt = require("jsonwebtoken");

app.use(cors({ origin: !0, credentials: !0 })), app.use(bodyParser.json());
const { mongoUrl: mongoUrl } = require("./dbConnection"),
  RoomModel = require("./models/roomsdata"),
  Message = require("./models/message"),
  badgeModel = require("./models/badges"),
  ColorsModel = require("./models/colors"),
  User = require("./models/user"),
  Offer = require("./models/offermodal"),
  Mods = require("./models/mods"),
  Banned = require("./models/banned"),
  PersonalMessage = require("./models/personalmessage"),
  userRoutes = require("./routes/userRoutes"),
  HuzaifaRoutes = require("./routes/huzaifaRoutes"),
  // { connect: connect } = require("./models/user"),
  Notification = require("./models/notifications"),
  CoordinateModel = require("./models/coordinates"),
  PackageModel = require("./models/vip");
(Otp = require("./models/otp")),
  (TransactionModel = require("./models/transactions")),
  (PaymentDetailsModel = require("./models/PaymentDetails.Js")),
  (ShopDetails = require("./models/shopdetails")),
  (Custom = require("./models/custom")),
  (webProducts = require("./models/webDetails")),
  (TermsAndConds = require("./models/terms"))(
    (server = http.createServer(app))
  );

var nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
var admin = require("firebase-admin");

var serviceAccount = require("./chatzyr-15d55-firebase-adminsdk-rlnk4-b40e0060f5.json");
const { log } = require("console");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendPushNotification = async (registrationToken, message) => {
  const sendMessage = {
    token: registrationToken,
    notification: {
      title: "Chatzyr",
      body: message,
    },
    data: {
      key1: "value1",
      key2: "value2",
    },
    android: {
      priority: "high",
    },
    apns: {
      payload: {
        aps: {
          badge: 42,
        },
      },
    },
  };

  admin
    .messaging()
    .send(sendMessage)
    .then((response) => {
      console.log("Notif sent", response);
    })
    .catch((error) => {
      console.error("Error sending message:", error);
    });
};

async function addLikesField() {
  try {
    // Update documents to add the likes field with a default value of 0
    const updateResult = await RoomModel.updateMany(
      {}, // Match all documents
      { $set: { roomOwner: "" } } // Add the likes field with a value of 0
    );

    console.log(
      `Matched ${updateResult.matchedCount} documents and modified ${updateResult.modifiedCount} documents`
    );
  } catch (err) {
    console.error(err);
  }
}

// Call the function to add the likes field
// addLikesField();

async function deletePerMessages(userId) {
  // app.delete("/messages/delete/:userId", async (req, res) => {

  try {
    // Delete all messages where the sender or recipient ID matches the provided userId
    const deleteResult = await PersonalMessage.deleteMany({
      $or: [{ senderId: userId }, { recepientId: userId }],
    });

    // res.json({ message: "All messages of the user deleted" });
    // console.log('msgs deleted');
  } catch (error) {
    console.error("Error deleting messages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
  // });
}

async function deleteCoordinates(deleteemail) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const roomsToDelete = await RoomModel.find({
      coordinates: {
        $elemMatch: {
          email: deleteemail,
        },
      },
    }).session(session);

    for (const room of roomsToDelete) {
      // Filter the coordinates for the specified email
      room.coordinates = room.coordinates.filter(
        (coord) => coord.email !== deleteemail
      );

      // Save the updated room
      await room.save();
    }

    await session.commitTransaction();
    session.endSession();

    //   console.log(${deleteemail}'s coordinates deleted from rooms.);
  } catch (error) {
    // Handle any potential errors
    await session.abortTransaction();
    session.endSession();
    console.error(error);
  }
}

async function mergedates(p, i) {
  const currentDate = moment().tz("Asia/Karachi");
  const shopDetailsDocuments = await ShopDetails.find({
    purchasedBy: p,
    itemId: i,
  });
  var dates = [];

  // Iterate over the ShopDetails documenstss
  for (const shopDetailsDocument of shopDetailsDocuments) {
    // Get the purchase date
    dates.push(shopDetailsDocument.validtill);
  }
  await ShopDetails.deleteMany({
    _id: {
      $in: shopDetailsDocuments.map(
        (shopDetailsDocument) => shopDetailsDocument._id
      ),
    },
  });

  const futureDates = dates.filter((dateStr) => {
    const date = moment.tz(dateStr, "Asia/Karachi");
    return date.isSameOrAfter(currentDate);
  });

  if (futureDates.length > 0) {
    const totalDaysToAdd = futureDates.reduce((total, dateStr) => {
      const date = moment.tz(dateStr, "Asia/Karachi");
      const daysDifference = date.diff(currentDate, "days");
      return total + daysDifference;
    }, 0);
    const newDate = currentDate.add(totalDaysToAdd, "days");
    const finalDate = newDate.format("YYYY-MM-DD HH:mm:ss");
    const finalDatex = newDate.format("DD-MM-YYYY");

    const asx = {
      itemId: i,
      purchasedBy: p,
      purchaseDate: moment().tz("Asia/Karachi").format("YYYY-MM-DD HH:mm:ss"),

      validtill: finalDate,
    };
    const h = new ShopDetails(asx);
    await h.save();

    return finalDatex;
  }
  return 0;
}

async function removeUserFromFriends(userEmail) {
  try {
    // Find all users where the provided email is in their friends list
    const usersWithFriend = await User.find({ "friends.email": userEmail });

    // Remove the user's email from each of their friends' lists
    const promises = usersWithFriend.map(async (user) => {
      user.friends = user.friends.filter(
        (friend) => friend.email !== userEmail
      );
      await user.save();
    });

    await Promise.all(promises);

    // console.log(`Removed user with email ${userEmail} from friends' lists.`);
    return true;
  } catch (error) {
    console.error("Error removing user from friends' lists:", error);
    throw error;
  }
}

async function deleteMessages(userToBeDeleted) {
  try {
    const rooms = await Message.find({
      messages: {
        $elemMatch: {
          user_id: userToBeDeleted,
        },
      },
    });

    if (rooms && rooms.length > 0) {
      // Iterate through each room

      for (const room of rooms) {
        // Filter the messages to exclude the user's messages

        room.messages = room.messages.filter(
          (message) => message.user_id !== userToBeDeleted
        );

        // Save the updated room
        await room.save();

        // console.log('Deleting...');
      }

      return 1;
    } else {
      // console.log("FOUND NOTHING IN ROOMS");
      return 2;
    }
  } catch (error) {
    // Handle the error
    console.log("ERR" + error);
    return 0;
  }
}
deleteMessages("demo1234@gmail.com");
function genotp() {
  const min = 10000;
  const max = 99999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "Info.chatzyr@gmail.com",
    pass: "haan rydj ivyx adcr",
  },
});

function sendotp(u, o) {
  try {
    Otp.deleteMany({ user: u })
      .then((result) => {
        // console.log(`Deletesd documents`);

        const newOtp = new Otp({
          user: u,
          code: o,
        });

        newOtp
          .save()
          .then(() => {
            // console.log('New document added successfully');
          })
          .catch((err) => {
            console.error(err);
          });
      })
      .catch((err) => {
        console.error(err);
      });

    var mailOptions = {
      from: "Info.chatzyr@gmail.com",
      to: u,
      subject: "🔐 Verify Your Email for OTP",
      html: `
            <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f2f2f2;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #ffffff;
                            border-radius: 8px;
                        }
                        h1 {
                            color: #007BFF;
                            text-align: center;
                        }
                        p {
                            color: #333;
                            font-size: 16px;
                            text-align: center;
                        }
                        .otp {
                            font-size: 24px;
                            font-weight: bold;
                            color: #FF5733;
                            text-align: center;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>🔐 Verify Your Email for ChatZyr </h1>
                        <p>Hi there! Please verify your email to complete the OTP verification process.</p>
                        <p>Your OTP: <span class="otp">${o}</span></p>
                    </div>
                </body>
            </html>
        `,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        //   console.log('Email sent: ' + info.response);
      }
    });

    return o;
  } catch (e) {
    console.log("Error Sending otp " + e);
    return 0;
  }
}

async function verifyOtp(u, o) {
  try {
    // Find the user in the database
    const user = await Otp.findOne({ user: u });

    // If the user does not exist, return 0
    if (!user) {
      return 0;
    }

    // Check if the OTP matches the user's OTP
    if (user.code !== o) {
      return 0;
    }

    // console.log("OTP Verified");
    // If the OTP matches, return 1
    return 1;
  } catch (error) {
    console.error("Error:", error);
    return 0; // Handle the error appropriately
  }
}
const updateTransactions = async (ids, email) => {
  const externalServerUrl = "https://api.paypro.com.pk/v2/ppro/auth"; // Replace with the actual URL

  // Send POST request to the external server
  const response = await axios.post(externalServerUrl, {
    clientid: "HjuCVG39MjdTrzS",
    clientsecret: "lpk8rmjTgmjfKZ0",
  });

  const token =
    response.headers["authorization"] ||
    response.headers["Authorization"] ||
    response.headers["token"]; // Case-insensitive
  const getorderstatus = "https://api.paypro.com.pk/v2/ppro/ggos"; // Replace with the actual URL

  ids.forEach(async (element) => {
    // console.log(element);
    if (!element.payproID) {
      return 0;
    }
    const params = {
      Username: "CHATZYR",
      Cpayid: element.payproID,
    };

    try {
      // Send GET request to the external server with headers and params
      const response = await axios.get(getorderstatus, {
        headers: {
          token: `${token}`, // Add token to headers
          "Content-Type": "application/json", // Set the content type to JSON
        },
        params: params, // Send params as query parameters
      });
      // console.log("here" + response.data[1].OrderStatus);

      if (response.data[1].OrderStatus == "PAID") {
        console.log("its paid ");

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
          // Update user balance
          const user = await User.findOne({ email: email }).session(session);
          if (!user) {
            throw new Error("User not found");
          }

          user.balance =
            (user.balance || 0) + parseInt(response.data[1].OrderAmountPaid);
          await user.save({ session });

          // Update transaction status
          const transaction = await TransactionModel.findOne({
            email: email,
            payproID: element.payproID,
          }).session(session);
          if (!transaction) {
            throw new Error("Transaction not found");
          }

          transaction.status = "Paid";
          await transaction.save({ session });

          // Commit transaction
          await session.commitTransaction();
          session.endSession();

          console.log(
            "User balance and transaction status updated successfully"
          );
        } catch (error) {
          // Abort transaction on error
          await session.abortTransaction();
          session.endSession();

          console.error("Transaction failed:", error);
        }
      }

      // console.log(response.data); // Log the response data
    } catch (error) {
      console.error(
        "Error:",
        error.response ? error.response.data : error.message
      );
    }
  });
};
function generateRandomString() {
  let e = "";
  for (let o = 0; o < 7; o++) {
    const o = Math.floor(62 * Math.random());
    e +=
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(
        o
      );
  }
  return e;
}

function getlink(link) {
  var startIndex = link.indexOf("v="); // Find the index of "v="
  if (startIndex !== -1) {
    startIndex += 2; // Move to the character after "v="
    var endIndex = link.indexOf("&", startIndex); // Find the index of "&" after "v="
    if (endIndex !== -1) {
      return link.substring(startIndex, endIndex); // Extract the video ID
    } else {
      return link.substring(startIndex); // If "&" is not found, extract until the end
    }
  } else {
    const match = link.match(/youtu\.be\/(.*?)\?/);

    if (match) {
      const extractedData = match[1];
      //   console.log("be wala link "+ extractedData); // This will log "KUpwupYj_tY" to the console
      return extractedData;
    } else {
      //   console.log("No match found. of be");

      const matched = link.match(/live\/(.*?)\?/);
      if (matched) {
        return matched[1];
      } else {
        return null;
      }
    }
  }
  return null; // Return null if "v=" is not found in the link
}

mongoose.connect(mongoUrl, { useNewUrlParser: !0, useUnifiedTopology: !0 }),
  mongoose.connection.on("connected", () => {
    console.log("DB connection successful");
  }),
  mongoose.connection.on("error", (e) => {
    console.log("DB connection failed", e);
  });

const wss = new WebSocket.Server({ server: server }),
  roomDataMap = new Map();
const clientsMap = new Map();
// console.log(clientsMap,roomDataMap);

async function fetchAndSendUpdates(roomId, x) {
  try {
    const roomData = await getfromdb(roomId, x);

    const clients = roomDataMap.get(roomId) || [];
    // console.log("SENDING FOR ROOM "+roomId);
    // console.log(JSON.stringify(clients));

    var xx = 1;
    clients.forEach((client) => {
      client.send(JSON.stringify(roomData));
      // console.log("SENDING TO CLIENT " + xx);
      xx++;
    });
  } catch (error) {
    console.error("Error fetching and sending updates:", error);
  }
}

const connections = new Set();

async function addservermessage(e, o) {
  // TO BE DELETED on 12 NOV
  const userx = await User.find({ email: e.user_id });
  if (!userx.length > 0) {
    return null;
  }

  const s = e;
  const r = o;
  const t = moment().tz("Asia/Karachi").format("YYYY-MM-DD HH:mm:ss");

  try {
    // Find the room by roomId
    const room = await RoomModel.findOne({ roomId: r });

    if (!room) {
      console.error("Room not found");
      throw new Error("Room not found");
    }

    // Check if the email exists in the room's coordinates
    const emailToCheck = s.user_id; // Assuming s.user_id is the email
    const emailExists = room.coordinates.some(
      (coord) => coord.email === emailToCheck
    );
    var checking = 0;
    if (!emailExists) {
      // console.log("Adding coordinates from function");
      // The email doesn't exist, so add coordinates
      room.coordinates.push({ email: emailToCheck, x: 215, y: 125 });
      await room.save();
      // console.log('Coordinates added successfully.');
    } else {
      // console.log('Coordinates already exist.');
      checking = 1;
    }

    let message = await Message.findOne({ room_id: r });

    if (!message) {
      console.error("Room not found");
      message = new Message({
        room_id: r,
        messages: [{ user_id: s.user_id, content: s.content, time: t }],
      });
      await message.save();
      // console.log("Created New Chat...");
      fetchAndSendUpdates(r);
    }

    if (message) {
      message.messages = message.messages.filter(
        (msg) => msg.content !== "xxrp7"
      );
      // console.log(s.user_id);

      const messageObject = { user_id: s.user_id, content: s.content, time: t };
      if (s.content == "xxrp7") {
        fetchAndSendUpdates(r);
        return null;
      }
      message.messages.push(messageObject);

      if (message.messages.length > 60) {
        const removeCount = message.messages.length - 60;
        message.messages.splice(0, removeCount);
      }

      await message.save();
      if (checking == 1) {
        fetchAndSendUpdates(r, 1);
      } else {
        fetchAndSendUpdates(r);
      }
      // console.log("MSG ADDED");
    }

    // console.log("Operation completed successfully");
  } catch (error) {
    console.error("Error:", error);
  }
}

async function getfromdb(e, x) {
  if (x == 1) {
    try {
      const o = e,
        s = await Message.aggregate([
          { $match: { room_id: o } },
          {
            $project: {
              _id: 0,
              room_id: 1,
              messages: {
                $map: {
                  input: "$messages",
                  as: "message",
                  in: {
                    user_id: "$$message.user_id",
                    content: "$$message.content",
                    time: "$$message.time",
                  },
                },
              },
            },
          },
        ]);
      // console.log("JUST MESSAGES SENT");
      return { mess: s[0] };
    } catch (e) {
      console.log("CANT FETCH MESSAGES " + e);
    }
  }

  if (x == 2) {
    try {
      const roomCoordinates = await RoomModel.aggregate([
        { $match: { roomId: e } },
        {
          $project: {
            _id: 0,
            roomId: 1,
            coordinates: {
              $map: {
                input: "$coordinates",
                as: "coord",
                in: {
                  _id: "$$coord._id",
                  email: "$$coord.email",
                  x: "$$coord.x",
                  y: "$$coord.y",
                },
              },
            },
          },
        },
      ]);

      // Extract the coordinates and emails into separate arrays
      const coordinates = roomCoordinates[0].coordinates;
      s = await Message.aggregate([
        { $match: { room_id: e } },
        {
          $project: {
            _id: 0,
            room_id: 1,
            messages: {
              $map: {
                input: "$messages",
                as: "message",
                in: {
                  user_id: "$$message.user_id",
                  content: "$$message.content",
                  time: "$$message.time",
                },
              },
            },
          },
        },
      ]);
      let r = [];
      if (s[0]) {
        r = [...new Set(s[0].messages.map((e) => e.user_id))];
      }
      // Create the response object with the desired structure
      const coordResponse = {
        coordinates,
        users: r,
      };
      // console.log(roomCoordinates[0]);
      return { coordinates: coordResponse };
    } catch (e) {
      console.log("Cannot fetch coordinates: " + e);
    }
  }

  try {
    const o = e,
      s = await Message.aggregate([
        { $match: { room_id: o } },
        {
          $project: {
            _id: 0,
            room_id: 1,
            messages: {
              $map: {
                input: "$messages",
                as: "message",
                in: {
                  user_id: "$$message.user_id",
                  content: "$$message.content",
                  time: "$$message.time",
                },
              },
            },
          },
        },
      ]);
    let r = [];
    if (s[0]) {
      r = [...new Set(s[0].messages.map((e) => e.user_id))];
    }
    const t = await User.aggregate([
      { $match: { email: { $in: r } } },
      {
        $project: {
          _id: 0,
          chatcolor: 1, // Include the chatcolor field
          usernamecolor: 1,
          username: 1,
          password: 1,
          email: 1,
          badge: 1,
          pic: 1,
          backgroundPic: 1,
          bio: 1,
          likes: 1,
          friends: 1,
          premium: 1,
        },
      },
    ]);
    const a = await RoomModel.aggregate([
      { $match: { roomId: o } },
      { $project: { _id: 0 } },
    ]);
    const n = t.reduce((e, o) => {
      const {
        usernamecolor,
        chatcolor,
        username: s,
        password: r,
        email: t,
        badge: a,
        pic: n,
        backgroundPic: i,
        bio: c,
        likes: d,
        friends: m,
        premium: l,
      } = o;
      return (
        (e[t] = {
          chatcolor, // Add chatcolor to the object
          usernamecolor,
          name: s,
          email: t,
          password: r,
          badge: a,
          pic: n,
          backgroundPic: i,
          bio: c,
          likes: d,
          friends: m,
          premium: l,
        }),
        e
      );
    }, {});
    const roomCoordinates = await RoomModel.aggregate([
      { $match: { roomId: e } },
      {
        $project: {
          _id: 0,
          roomId: 1,
          coordinates: {
            $map: {
              input: "$coordinates",
              as: "coord",
              in: {
                _id: "$$coord._id",
                email: "$$coord.email",
                x: "$$coord.x",
                y: "$$coord.y",
              },
            },
          },
        },
      },
    ]);

    // Extract the coordinates and emails into separate arrays
    const coordinates = roomCoordinates[0].coordinates;

    // Create the response object with the desired structure

    RoomModel.updateMany({}, { $set: { users: r } })
      .then((e) => {})
      .catch((e) => {
        console.error("Error updating users:", e);
      });
    RoomModel.updateMany(
      { "coordinates.x": { $exists: !1 }, "coordinates.y": { $exists: !1 } },
      { $set: { "coordinates.x": 215, "coordinates.y": 125 } }
    )
      .then((e) => {})
      .catch((e) => {
        console.error("Error updating coordinates:", e);
      });
    const i = await Mods.aggregate([{ $project: { _id: 0 } }]);
    const c = { ...a[0], users: r, activemods: i };
    const coordResponse = {
      coordinates,
      users: r,
    };
    return {
      mess: s[0],
      userdetails: n,
      roomdata: c,
      coordinates: coordResponse,
    };
  } catch (e) {
    throw (console.error("Error in getfromdb:", e), e);
  }
}

var roomids = [];
async function updateCoordinatesWithRetry(roomId, userId, x, y) {
  // console.log('coord');
  const room = await RoomModel.findOne({ roomId });

  if (!room) {
    throw new Error("Room Not Found!");
  }
  const userIndex = room.coordinates.findIndex((obj) => obj.email === userId);

  // console.log("INDEX IS " + userIndex);
  // const userIndex = room.users.indexOf(userId);

  if (userIndex === -1) {
    throw new Error("User Not Found!");
  }

  if (room.coordinates[userIndex]) {
    room.coordinates[userIndex].x = x;
    room.coordinates[userIndex].y = y;
    // console.log("UPDATING COORD");
  } else {
    room.coordinates[userIndex] = { email: userId, x, y };
  }

  await room.save();
  fetchAndSendUpdates(roomId, 2);
  // console.log("COORDINATES UPDATES SUCESSFULLY " + x, y);
}
const activeUsers = new Map(); // Use a Map to store active users and their last active time
const inactivityTimeout = 2.5 * 60 * 1000; // 2.5 minutes in milliseconds
setInterval(() => {
  const currentTime = Date.now();
  activeUsers.forEach((userData, email) => {
    if (currentTime - userData.lastActive > inactivityTimeout) {
      // User has been inactive for more than the specified time
      // Remove the user from activeUsers and close the connection
      activeUsers.delete(email);
      // console.log("DELETED " + email);
      // userData.connection.close();
    }
  });
}, 15000); // Check for inactivity every second

const userConnections = new Map();
const roomActiveUsers = new Map();

const roomUsers = new Map(); // To track which users are in which room
wss.on("connection", (e) => {
  connections.add(e),
    console.log("WebSocket client connected"),
    e.on("message", async (o) => {
      try {
        const s = JSON.parse(o);
        if (s.action == "ping") {
          // console.log("PING");
          // Received a "ping" message from the client, respond with a "pong"
          const { roomId } = s;
          const t = { msg: "pong" };
          e.send(JSON.stringify(t));
        } else if (s.action === "getFriends") {
          const { userId } = s.data;

          try {
            // Find the user with the specified userId
            const user = await User.findOne({ email: userId });

            if (!user) {
              return res.status(404).json({ message: "User not found" });
            }

            // Get the list of friend emails
            const friendEmails = user.friends.map((friend) => friend.email);

            // Find the details of each friend using their email addresses
            const friendDetails = await User.find({
              email: { $in: friendEmails },
            });

            // Fetch the last message for each friend
            const messages = await Promise.all(
              friendDetails.map(async (friend) => {
                const lastMessage = await PersonalMessage.find({
                  $or: [
                    { senderId: userId, recepientId: friend.email },
                    { senderId: friend.email, recepientId: userId },
                  ],
                })
                  .sort({ timeStamp: -1 }) // Sort by timestamp in descending order
                  .limit(1); // Limit the result to only one message

                // console.log(lastMessage);
                return {
                  ...friend.toObject(),
                  lastMessage: lastMessage, // Assuming lastMessage is the message itself
                };
              })
            );
            // Return the details of friends along with their last messages to the frontend
            // res.json({ friends: messages });
            e.send(JSON.stringify({ friends: messages }));
          } catch (error) {
            console.error("Error fetching user friends:", error);
            res.status(500).json({ message: "Internal server error" });
          }
        } else if (s.action === "getNotifications") {
          // Handle the 'getNotifications' action here
          const { recipientEmail } = s.data;
          // console.log(s);

          // console.log("ALIVE REQ "+ recipientEmail);
          activeUsers.set(recipientEmail, {
            connection: e,
            lastActive: Date.now(),
          });

          try {
            const notifications = await Notification.find({
              recipient: recipientEmail,
              read: false,
            }).populate("sender");
            // Send the notifications to the client
            e.send(JSON.stringify({ notifications }));
            var onlineusers = ['Tayna123@gmail.com','Vula12@gmail.com'];
            // onlineusers = Array.from(activeUsers.keys());
            onlineusers = onlineusers.concat(Array.from(activeUsers.keys()));
            // console.log(onlineusers);
            const onlineusersDetails = {};

            for (const userEmailObj of onlineusers) {
              let userEmail;
            
              // Check if the item is a JSON string or a plain string
              try {
                // Try to parse as JSON
                userEmail = JSON.parse(userEmailObj).email;
              } catch (error) {
                // If parsing fails, assume it's a plain email string
                userEmail = userEmailObj;
              }
            
              // Fetch user details from the database
              const userFromDB = await User.findOne({ email: userEmail });
            
              if (userFromDB) {
                onlineusersDetails[userEmail] = {
                  backgroundPic: userFromDB.backgroundPic,
                  badge: userFromDB.badge,
                  bio: userFromDB.bio,
                  chatcolor: userFromDB.chatcolor || "#FFFFFF",
                  email: userFromDB.email,
                  friends: userFromDB.friends,
                  likes: userFromDB.likes,
                  name: userFromDB.username,
                  password: userFromDB.password,
                  pic: userFromDB.pic,
                  premium: userFromDB.premium || false,
                  usernamecolor: userFromDB.usernamecolor || "#FF0000",
                };
              }
            }
            // console.log(onlineusersDetails);
            
            // log
            e.send(JSON.stringify({ onlineusers: onlineusersDetails }));

            // e.send(JSON.stringify({ onlineusers }));
          } catch (error) {
            console.error("Error fetching notifications:", error);
          }
        } else if (s.messageType === "text") {
          // Save the chat message to MongoDB using Mongoose
          try {
            const { senderId, recipientId, messageType, message } = s;
            // console.log(senderId, recipientId);
            userConnections.set(senderId, e);
            const receiverConnection = userConnections.get(recipientId);

            const newMessage = new PersonalMessage({
              senderId,
              recepientId: recipientId,
              messageType,
              message: message,
              timestamp: new Date(),
            });

            await newMessage.save();

            if (e.readyState === WebSocket.OPEN) {
              e.send(JSON.stringify(newMessage));
            }

            // if (receiverConnection && receiverConnection.readyState === WebSocket.OPEN) {
            //   receiverConnection.send(JSON.stringify(newMessage));
            // }
            // console.log('message sent!');
            // Broadcast the message to all connected clients
            if (
              receiverConnection &&
              receiverConnection.readyState === WebSocket.OPEN
            ) {
              receiverConnection.send(JSON.stringify(newMessage));
              await PersonalMessage.updateOne(
                { _id: newMessage._id },
                { $set: { read: true } }
              );
            }
            // wss.clients.forEach((client) => {
            //   // console.log(client);
            //   if (client !== e && client.readyState === WebSocket.OPEN) {
            //     client.send(JSON.stringify(newMessage));
            //     newMessage = await PersonalMessage.updateOne(
            //       { $set: { read: true } }
            //     )
            //   }
            // });

            const messageCount = await PersonalMessage.countDocuments({
              senderId,
              recepientId: recipientId,
            });

            // If the count exceeds the limit (e.g., 60), delete the oldest message
            const messageLimit = 40;
            // console.log(messageCount);
            if (messageCount > messageLimit) {
              const oldestMessage = await PersonalMessage.findOne(
                {
                  $or: [
                    { senderId, recepientId: recipientId },
                    { senderId: recipientId, recepientId: senderId },
                  ],
                },
                {},
                { sort: { timestamp: 1 } }
              );

              if (oldestMessage) {
                // console.log(oldestMessage);

                // Delete the oldest message
                await PersonalMessage.deleteOne({ _id: oldestMessage._id });
                // console.log(oldestMessage+ ' msg deleted');
              }
            } else {
              // console.error("No messages found to remove.");
            }
          } catch (error) {
            console.error("Error saving chat message:", error);
          }
        } else if (s.action == "pingdm") {
          const tx = { msg: "pong" };
          e.send(JSON.stringify(tx));
        } else if (s.action === "getMessages") {
          const { senderEmail, recipientEmail } = s.data;
          const updateResult = await PersonalMessage.updateMany(
            {
              $or: [
                { senderId: senderEmail, recepientId: recipientEmail },
                { senderId: recipientEmail, recepientId: senderEmail },
              ],
              read: false, // Only mark unread messages as read
            },
            { $set: { read: true } }
          );
          const messages = await PersonalMessage.find({
            $or: [
              { senderId: senderEmail, recepientId: recipientEmail },
              { senderId: recipientEmail, recepientId: senderEmail },
            ],
          }).sort({ timestamp: 1 });
          // console.log(messages);
          // Send the retrieved messages to the client
          e.send(JSON.stringify(messages));
          // return messages;
          // console.log('');
        } else if ("x" in s) {
          const { roomId1, userId, x, y } = s;
          try {
            // console.log("ROOM ID " + roomId1);
            // console.log("USER ID " + userId);

            await updateCoordinatesWithRetry(roomId1, userId, x, y);
          } catch (error) {
            console.error("Failed to update coordinates inside sockets", error);
          }
        }
        // else if ("roomId" in s) {
        //     const o = s.roomId;
        //     roomDataMap.has(o) || roomDataMap.set(o, []), roomDataMap.get(o).push(e), ;
        // }

        // else if ("roomId" in s) {
        //     const roomId = s.roomId;
        //     if (!roomDataMap.has(roomId)) {
        //         roomDataMap.set(roomId, []);
        //     }
        //     roomDataMap.get(roomId).push(e);

        // }
        // else if ("roomId" in s) {
        //   const roomId = s.roomId;

        //   roomMutex
        //     .runExclusive(async () => {
        //       if (!roomDataMap.has(roomId)) {
        //         // console.log("ROOM NF " + roomId);
        //         roomDataMap.set(roomId, []);
        //         roomids.push(roomId);
        //       }

        //       // console.log("ADDED To " + roomId);
        //       roomDataMap.get(roomId).push(e);

        //       roomids.push(roomId);
        //     })
        //     .then(() => {
        //       const uniqueRoomIds = new Set(roomids);
        //       const idx = Array.from(uniqueRoomIds);
        //       roomids.length = 0;
        //       roomids = [];

        //       idx.forEach((roome) => {
        //         fetchAndSendUpdates(roome);
        //       });
        //       // console.log("SENT UPDATES!!");
        //     });
        // }
        else if ("roomId" in s) {
          const roomId = s.roomId;
          const userId = s.userid; // Make sure client sends this

          roomMutex
            .runExclusive(async () => {
              // Add to room connections as before
              if (!roomDataMap.has(roomId)) {
                roomDataMap.set(roomId, []);
                roomids.push(roomId);
              }
              roomDataMap.get(roomId).push(e);
              roomids.push(roomId);

              // Add to active users tracking
              if (!roomActiveUsers.has(roomId)) {
                roomActiveUsers.set(roomId, new Map());
              }

              // Get user details from database
              const user = await User.findOne({ email: userId });
              if (user) {
                roomActiveUsers.get(roomId).set(userId, {
                  email: user.email,
                  backgroundPic: user.backgroundPic || "default_background_url",
                  badge: user.badge,
                  bio: user.bio,
                  chatcolor: user.chatcolor,
                  friends: user.friends,
                  likes: user.likes,
                  name: user.username,
                  pic: user.pic,
                  premium: user.premium,
                  usernamecolor: user.usernamecolor,
                  connection: e,
                });

                // Broadcast updated active users list to all clients in the room
                // broadcastActiveUsers(roomId);
              }
            })
            .then(() => {
              const uniqueRoomIds = new Set(roomids);
              const idx = Array.from(uniqueRoomIds);
              roomids.length = 0;
              roomids = [];

              idx.forEach((roome) => {
                fetchAndSendUpdates(roome);
              });
            });
        }

        // Add handler for requesting active users
        // else if (s.action === "getActiveUsers") {
        //   console.log("Received request for active users");
        //   const { roomId } = s;
        //   if (roomActiveUsers.has(roomId)) {
        //     const users = Array.from(roomActiveUsers.get(roomId).values()).map(user => ({
        //       email: user.email,
        //       backgroundPic: user.backgroundPic,
        //       badge: user.badge,
        //       bio: user.bio,
        //       chatcolor: user.chatcolor,
        //       friends: user.friends,
        //       likes: user.likes,
        //       name: user.name,
        //       pic: user.pic,
        //       premium: user.premium,
        //       usernamecolor: user.usernamecolor
        //     }));
        //     e.send(JSON.stringify({
        //       type: 'active_users',
        //       users: users
        //     }));
        //   }
        // }
        else if ("room_id" in s) {
          addservermessage(s.mymessage, s.room_id);
        }
      } catch (e) {
        console.error("Error parsing JSON:", e);
      }
    }),
    e.on("close", () => {
      roomDataMap.forEach((clients, roomId) => {
        const index = clients.indexOf(e);
        if (index !== -1) {
          clients.splice(index, 1); // Remove the disconnected user from the room
        }
      });
      userConnections.forEach((connection, userId) => {
        if (connection === e) {
          userConnections.delete(userId);
        }
      });
      connections.delete(e), console.log("WebSocket client disconnected");
      clientsMap.delete(e);
    });
}),
  app.use(userRoutes),
  // Huzaifa New Routes
  app.use(HuzaifaRoutes),
  //Tahir New Routes

  app.get("/find-package", authenticateToken, async (req, res) => {
    const email = req.query.email; // Get the email from the request query string

    try {
      // Find all ShopDetails by the purchasedBy email
      const shopDetails = await ShopDetails.find({ purchasedBy: email });

      if (shopDetails) {
        // Initialize an array to store the results
        const result = [];

        // Iterate through the shopDetails array
        for (const detail of shopDetails) {
          // Get the itemId for each detail
          const itemId = detail.itemId;

          // Find the corresponding Package using the itemId
          const package = await PackageModel.findOne({ id: itemId });

          if (package) {
            // Push the result to the array
            result.push({
              title: package.title,
              validtill: detail.validtill,
            });
          }
        }

        if (result.length > 0) {
          // Return the array of results
          // console.log(JSON.stringify(result));
          res.json(result);
        } else {
          res.status(404).json({ message: "No matching packages found" });
        }
      } else {
        res.status(404).json({ message: "ShopDetails not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });
app.get("/loginauthcheck", authenticateToken, async (req, res) => {
  res.sendStatus(200);
});
app.put("/messages/mark-all-read/:user1/:user2", async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    // Update all unread messages between user1 and user2 to set their 'read' status as 'true'

    res.json({ message: "All unread messages between users marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.post("/unblockuser", authenticateToken, async (req, res) => {
  const { roomIdx, userIdx } = req.body;
  // console.log(roomIdx,userIdx);

  try {
    // Find the room document by roomId
    const room = await RoomModel.findOne({ roomId: roomIdx });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the user is in the blocked array
    const userIndex = room.blocked.indexOf(userIdx);
    // console.log( "ss "+userIndex);
    if (userIndex !== -1) {
      // Remove the user from the blocked array
      room.blocked.splice(userIndex, 1);

      // Save the updated room document
      await room.save();
      fetchAndSendUpdates(roomIdx);
      return res.sendStatus(200);
    } else {
      return res.sendStatus(404);
    }
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

app.post("/verotp", async (req, res) => {
  try {
    //   console.log(req.body.otp,req.body.email);
    var a = await verifyOtp(req.body.email, req.body.otp);

    if (a) {
      // console.log("DUSTED");
      res.sendStatus(200);
    } else {
      res.sendStatus(203);
    }
  } catch (error) {
    console.log(error);
    return res.status(500);
  }
});
// Define a route to fetch and store the data
app.get("/webDetails", async (req, res) => {
  try {
    const details = await webProducts.find(); // Retrieve all details from the collection
    res.json(details); // Send the details as a JSON response
    // console.log('details Sent!');
  } catch (error) {
    console.error("Error fetching web details:", error);
    res.status(500).send("Error fetching web details");
  }
});

// Endpoint to handle order details and send email
app.post("/sendOrderEmail", (req, res) => {
  const { prodname, price, orderID, orderDetails } = req.body; // Assume the request contains order details

  // Compose email
  const mailOptions = {
    from: orderDetails.email,
    to: "chatzyr@gmail.com", // Replace with the specific email
    subject: "New Order",
    text: `New order received!\nDetails:\nOrder ID: ${orderID}\nName: ${orderDetails.name}\nEmail: ${orderDetails.email}\nProduct: ${prodname}\nPrice: $${price}`,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send("Error"); // Handle error response
    } else {
      // console.log('Email sent: ' + info.response);
      res.send("Email sent"); // Send success response
    }
  });
});

app.post("/sendcoin", authenticateToken, async (req, res) => {
  const { sendby, sendto, amount } = req.body;

  const session = await mongoose.startSession();
  if (sendby === sendto) {
    res.sendStatus(203);
    return 0;
  }
  try {
    await session.withTransaction(async () => {
      // Find the sender user

      const user = await User.findOne({ email: sendby }).session(session);
      const userx = await User.findOne({ email: sendto }).session(session);
      if (!user || !userx) {
        res.sendStatus(203);
        if (!userx) console.log("User Not Found Receiver ");
        return null;
      }

      if (user.balance < amount) {
        res.sendStatus(205); // Change the status code to 400 for a bad request

        return null;
      }

      // Update the sender's balance

      var xa = parseFloat(parseFloat(user.balance) - parseFloat(amount));
      user.balance = xa.toString();

      await user.save();

      // Find the recipient user

      // Update the recipient's balance

      var x = parseFloat(parseFloat(userx.balance) + parseFloat(amount));
      userx.balance = x.toString();

      await userx.save();
    });

    // Send a success response

    res.sendStatus(200);
  } catch (e) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
  } finally {
    session.endSession(); // Close the session when done
  }
});

app.post("/buyitem", authenticateToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const time = moment().tz("Asia/Karachi").format("YYYY-MM-DD HH:mm:ss");
    const { itemid, userid, type, price, duration } = req.body;
    // console.log(req.body);
    const user = await User.findOne({ email: userid }).session(session);

    if (!user) {
      throw new Error("User not found");
    }

    const currentBalance = user.balance;

    if (price <= currentBalance) {
      const shopItem = await PackageModel.findOne({ id: itemid }).session(
        session
      );

      if (!shopItem) {
        throw new Error("Shop item noot found");
      }

      if (type === "badge") {
        user.badge = shopItem.id;

        try {
          const cus = await Custom.findOne({ userid: userid }).session(session);

          if (cus) {
            cus.badges.push(shopItem.id);
            await cus.save();
          } else {
            const ap = {
              userid: userid,
              badges: [shopItem.id],
              colors: [],
            };

            const cux = new Custom(ap);
            await cux.save();
          }
        } catch (error) {
          console.error("Error:", error);
          // Handle the error as needed (log, throw, etc.)
        }
      } else if (type === "chatcolor") {
        console.log("in color");
        user.chatcolor = shopItem.id;
        try {
          const cusx = await Custom.findOne({ userid: userid }).session(
            session
          );

          if (cusx) {
            cusx.colors.push(shopItem.id);
            await cusx.save();
            console.log("ALL SET COLOR xx");
          } else {
            const apx = {
              userid: userid,
              badges: [],
              colors: [shopItem.id],
            };

            const cuxx = new Custom(apx);
            await cuxx.save();
            console.log("ALL SET COLOR");
          }
        } catch (error) {
          console.error("Error:", error);
          // Handle the error as needed (log, throw, etc.)
        }
      } else if (type === "namecolor") {
        user.namecolor = shopItem.id;
      } else if (type === "vip2") {
        // Determine which VIP level you want to apply
        // Assuming shopItem contains vip1, vip2, vip3 properties
        user.premium = shopItem.type;
      } else if (type === "vip3") {
        // Determine which VIP level you want to apply
        // Assuming shopItem contains vip1, vip2, vip3 properties
        user.premium = shopItem.type;
      }

      user.balance -= price;

      await user.save();
      var newbuying = {};
      if (duration == "1 Month") {
        const parsedTime = moment(time, "YYYY-MM-DD HH:mm:ss");

        const newTime = parsedTime.add(30, "days");
        const afteronemonth = newTime.format("YYYY-MM-DD HH:mm:ss");
        newbuying = {
          itemId: itemid,
          purchasedBy: userid,
          purchaseDate: time,
          validtill: afteronemonth,
        };
      }

      if (duration == "3 Months") {
        const parsedTime = moment(time, "YYYY-MM-DD HH:mm:ss");

        const newTime = parsedTime.add(90, "days");
        const afteronemonth = newTime.format("YYYY-MM-DD HH:mm:ss");
        newbuying = {
          itemId: itemid,
          purchasedBy: userid,
          purchaseDate: time,
          validtill: afteronemonth,
        };
      }
      if (duration == "6 Months") {
        const parsedTime = moment(time, "YYYY-MM-DD HH:mm:ss");

        const newTime = parsedTime.add(180, "days");
        const afteronemonth = newTime.format("YYYY-MM-DD HH:mm:ss");
        newbuying = {
          itemId: itemid,
          purchasedBy: userid,
          purchaseDate: time,
          validtill: afteronemonth,
        };
      }
      if (duration == "1 Year") {
        const parsedTime = moment(time, "YYYY-MM-DD HH:mm:ss");

        const newTime = parsedTime.add(364, "days");
        const afteronemonth = newTime.format("YYYY-MM-DD HH:mm:ss");
        newbuying = {
          itemId: itemid,
          purchasedBy: userid,
          purchaseDate: time,
          validtill: afteronemonth,
        };
      }
      const sx = new ShopDetails(newbuying);
      await sx.save();

      //transation sucessful
      //send xxrp7 message if socket connection is already made
      //refresh balance
      const a = await mergedates(userid, itemid);
      if (a != 0) {
        res.status(200).json({ date: a, title: shopItem.title });
        await session.commitTransaction();
        session.endSession();
      } else {
        res.sendStatus(202);
        await session.commitTransaction();
        session.endSession();
      }
    } else {
      //LOW BALANCE ALERT
      res.sendStatus(202);
      await session.commitTransaction();
      session.endSession();
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    //AN ERROR ACCOURED TRY AGAIN ALERT
    res.sendStatus(400); // You may want to return an error status code
  }
});

app.get("/api/packages", authenticateToken, async (req, res) => {
  try {
    // Fetch all packages from the database
    const packages = await PackageModel.find();
    res.json(packages);
  } catch (error) {
    console.error("Error fetching packages:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching packages" });
  }
});

app.post("/sendotp", async (req, res) => {
  try {
    var p = sendotp(req.body.email, genotp());
    if (p != 0) {
      res.json({ otp: p });
      // console.log("TOP SEND "+p);
    }
  } catch (error) {
    console.log(error);
    return res.status(500);
  }
});
app.post("/resetpassword", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.findOne({ email });

    if (!user) {
      res.sendStatus(202);
      throw new Error("User not found");
    }

    user.password = hashedPassword;

    await user.save();
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    return res.status(500);
  }
});
app.post("/storesms", async (req, res) => {
  // console.log("HERE");
  var temp = "";
  try {
    const time = moment().tz("Asia/Karachi").format("YYYY-MM-DD HH:mm:ss");
    const date = moment().tz("Asia/Karachi").format("DD/MM/YYYY");

    const externalServerUrl = "https://api.paypro.com.pk/v2/ppro/auth"; // Replace with the actual URL

    // Send POST request to the external server
    const response = await axios.post(externalServerUrl, {
      clientid: "HjuCVG39MjdTrzS",
      clientsecret: "lpk8rmjTgmjfKZ0",
    });

    const token =
      response.headers["authorization"] ||
      response.headers["Authorization"] ||
      response.headers["token"]; // Case-insensitive

    const createOrderUrl = "https://api.paypro.com.pk/v2/ppro/co"; // Replace with the actual URL

    // Prepare the request body
    const requestData = [
      {
        MerchantId: "CHATZYR",
      },
      {
        OrderNumber: req.body.orderNo,
        OrderAmount: req.body.amount,
        OrderDueDate: date,
        OrderType: "Service",
        IssueDate: date,
        OrderExpireAfterSeconds: "900",
        CustomerName: req.body.name,
        CustomerMobile: req.body.phone,
        CustomerEmail: req.body.email,
        CustomerAddress: req.body.address,
      },
    ];
    // console.log(token)
    try {
      // Send POST request to the external server with headers
      const response = await axios.post(createOrderUrl, requestData, {
        headers: {
          token: `${token}`, // Add token to headers
          "Content-Type": "application/json", // Set the content type to JSON if needed
        },
      });

      // Handle response
      // console.log('Response:', response.data );
      if (response.data[0].Status != "00") {
        console.log(response.data);
        res.sendStatus(400);
        return 0;
      }
      temp = response.data[1];
    } catch (error) {
      // Handle error
      res.sendStatus(400);
      console.error("Error:", error);
      return 0;
    }

    const transaction = new TransactionModel({
      email: req.body.email,
      transaction_id: req.body.orderNo,
      amount: req.body.amount,
      time: time,
      status: "pending",
      payproID: temp.PayProId,
    });
    await transaction.save();
    res.status(200).json({ link: temp.Click2Pay });
  } catch (e) {
    res.sendStatus(400);
    console.log("Sorry cant add transcation" + e);
  }
});

app.get(
  "/find-transaction/:transaction_id",
  authenticateToken,
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transactionId = req.params.transaction_id;
      const userEmail = req.query.userEmail;

      //   console.log(transactionId);

      // Find the transaction by transaction_id within the session
      const transaction = await TransactionModel.findOne({
        transaction_id: transactionId,
      }).session(session);

      if (!transaction) {
        // Abort the session and return a 404 response
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Transaction not found" });
      }
      // console.log(transaction.status);
      if (transaction.status === "verified") {
        // Assuming you have user email available in the request (req.userEmail)

        // Update the transaction status and email within the session
        transaction.status = "done";
        transaction.email = userEmail;

        const user = await User.findOne({ email: userEmail }).session(session);

        if (user) {
          // Update the user's balance
          user.balance += parseFloat(transaction.amount);
          // Save the updated user and transaction within the session
          await Promise.all([
            user.save({ session }),
            transaction.save({ session }),
          ]);

          // Commit the session
          await session.commitTransaction();
          session.endSession();

          // Return the updated amount and a 200 status to the frontend
          return res.status(200).json({ amount: user.balance });
        } else {
          // If user is not found, abort the session
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ message: "User not found" });
        }
      } else {
        // Abort the session and return a 403 response
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({ message: "Transaction is not verified" });
      }
    } catch (error) {
      console.error(error);

      // Abort the session in case of an error and return a 500 response
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);
// Define a route to fetch payment details
app.get("/api/payment-details", authenticateToken, async (req, res) => {
  try {
    const paymentDetails = await PaymentDetailsModel.findOne({}); // Use await to wait for the promise
    if (!paymentDetails) {
      return res.status(404).json({ error: "Payment details not found" });
    }
    res.json(paymentDetails);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// app.get("/find-transactions/:email", authenticateToken, async (req, res) => {
//   console.log("req");
//   try {
//     const email = req.params.email;

//     const ids = await TransactionModel.find({
//       email: email,
//       status: "pending",
//     });
//     // console.log(ids);

//     await updateTransactions(ids, email);
//     // Find all transactions with the given email and status "done"

//     const transactions = await TransactionModel.find({ email });

//     if (transactions.length === 0) {
//       return res.status(404).json({
//         message:
//           'No transactions found with status "done" for the specified email.',
//       });
//     }

//     res.status(200).json(transactions);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

app.get("/find-transactions/:email", authenticateToken, async (req, res) => {
  // console.log("req");
  try {
    const email = req.params.email;

    const ids = await TransactionModel.find({
      email: email,
      status: "pending",
    });
    // console.log(ids);
    await updateTransactions(ids, email);
    // Find all transactions with the given email and status "done"

    const transactions = await TransactionModel.find({ email });

    if (transactions.length === 0) {
      return res.status(404).json({
        message:
          'No transactions found with status "done" for the specified email.',
      });
    }

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error on Line 1789" + error);
    res.status(500).json({ message: "Internal server error" });
  }
});
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"];
  // console.log("SERVER HD "+JSON.stringify(req.headers));

  if (token === undefined) {
    // console.log("TOKEN UNDEFINED");
    return res.sendStatus(401);
  }

  jwt.verify(token, "Q$r2K6W8n!jCW%Zk", (err, user) => {
    if (err) {
      // console.log("TOKEN FAILED");
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}
app.get("/fetchver", authenticateToken, async (e, o) => {
  console.log("HERE");
  try {
    t = {
      version: "2.0.0",
      link: "https://play.google.com/store/apps/details?id=com.spotflux90.chatzyeAppUpdate",
    };
    o.json(t);
  } catch (e) {
    console.error("Error:", e),
      o.status(500).json({ error: "Internal server error" });
  }
}),
  app.get("/fetchData", authenticateToken, async (e, o) => {
    try {
      // console.log("fetch data");
      const e = await RoomModel.find(),
        s = await Offer.aggregate([{ $project: { _id: 0, __v: 0 } }]),
        r = await Mods.aggregate([{ $project: { _id: 0, __v: 0 } }]),
        rx = await Banned.aggregate([{ $project: { _id: 0, __v: 0 } }]),
        t = { documents: e, offer: s[0], mymods: r, banned: rx };
      o.json(t);
    } catch (e) {
      console.error("Error:", e),
        o.status(500).json({ error: "Internal server error" });
    }
  }),
  app.post("/fetchcolors", authenticateToken, async (req, res) => {
    const { userid } = req.body.a;
    // console.log("AA " + userid);
    try {
      const t = await User.find(
        { email: userid },
        { _id: 0, chatcolor: 1, premium: 1 }
      );

      // Query the database to fetch all colorss
      const allColors = await ColorsModel.aggregate([
        {
          $project: {
            _id: 0, // Exclude the _id field
            __v: 0, // Exclude the __v field
          },
        },
      ]);

      const rex = { allcolors: allColors, premium: t[0] };
      res.status(200).json(rex);
    } catch (err) {
      console.log(err);
      // Handle any errors that occur during the database query
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
app.post("/updatebackgroundpic", authenticateToken, async (e, o) => {
  const s = await mongoose.startSession();
  s.startTransaction();
  try {
    const { useremail: r, profileurl: t } = e.body.imgdata,
      a = await User.findOneAndUpdate(
        { email: r },
        { backgroundPic: t },
        { new: !0 }
      ).session(s);
    await s.commitTransaction(),
      s.endSession(),
      o.json({ message: "Profile Pic updated successfully", user: a });
    // for (const e of roomDataMap.keys()) fetchAndSendUpdates(e);
  } catch (e) {
    await s.abortTransaction(),
      s.endSession(),
      console.error(e),
      o.status(500).json({ message: "An error occurred" });
  }
}),
  app.get("/terms", async (req, res) => {
    try {
      const termsData = await TermsAndConds.find();
      res.json(termsData);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
app.get("/users/:email/profile", authenticateToken, async (e, o) => {
  try {
    const s = e.params.email;
    // console.log(s);
    const r = await User.findOne({ email: s });
    if (!r) return o.status(404).json({ message: "User not found" });
    o.status(200).json(r);
  } catch (e) {
    console.error(e), o.status(500).json({ message: "Server error" });
  }
}),
  app.put("/users/:email/updateprofile", async (e, s) => {
    try {
      const t = e.params.email,
        { username: a, bio: o } = e.body,
        n = await User.findOne({ email: t });
      if (!n) return s.status(404).json({ message: "User not found" });
      (n.username = a),
        (n.bio = o),
        await n.save(),
        s.status(200).json({ message: "User updated successfully" });
    } catch (e) {
      console.error(e), s.status(500).json({ message: "Server error" });
    }
  }),
  app.put("/updateprofile", authenticateToken, async (req, res) => {
    try {
      // console.log(req.body);
      const userEmail = req.body.email;
      const { username, bio, userStatus } = req.body;

      const user = await User.findOne({ email: userEmail });
      if (!user) return res.status(404).json({ message: "User not found" });

      user.username = username;
      user.bio = bio;
      user.status = userStatus;
      await user.save();

      res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });

app.post(
  "/users/:userId/increment-likes",
  authenticateToken,
  async (req, res) => {
    const { userId: likedUserId } = req.params;
    const { user: loggedInUser } = req.body; // Assuming you have the logged-in user information in the request body
    // console.log(req.body,req.params);
    try {
      // Check if the logged-in user has already liked the profile of the user with likedUserId
      const likedUser = await User.findOne({ email: likedUserId });
      const logInUser = await User.findOne({ email: loggedInUser });
      // console.log(likedUser.fcmToken);
      // console.log(loggedInUser,logInUser);

      if (!likedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if the logged-in user's ID is in the likedBy array of the likedUser
      if (likedUser.likedBy.includes(loggedInUser)) {
        return res
          .status(400)
          .json({ message: "You have already liked this profile" });
      }
      const message = logInUser.username + "liked your profile!";
      // Increment the likes count of the likedUser and add the logged-in user's ID to the likedBy array
      likedUser.likes += 1;
      likedUser.likedBy.push(loggedInUser);

      // Save the updated likedUser
      await likedUser.save();

      // for (const e of roomDataMap.keys()) fetchAndSendUpdates(e);

      sendPushNotification(likedUser.fcmToken, message);

      return res.status(200).json({ user: likedUser });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.post("/warning-notifications", authenticateToken, async (req, res) => {
  try {
    const { sender: s, recipients: r, message: t, type: a, pic: n } = req.body;

    const notifications = r.map(async (recipient) => {
      // Check if recipient is null and handle it
      if (recipient === null || recipient == "") {
        // Handle the null recipient case here, you may skip creating the notification or set a default recipient.
      } else {
        try {
          const notification = new Notification({
            sender: s,
            recipient,
            message: t,
            type: a,
            pic: n,
          });
          await notification.save();
          return notification;
        } catch (e) {
          // console.log("Error creating Noti " + recipient);
        }
      }
    });

    await Promise.all(notifications);
    res.status(201).json({ message: "Notifications created" });
    //   console.log("Notifications created");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.post("/loadcustom", authenticateToken, async (e, o) => {
  const ua = e.body.email;
  const s = await mongoose.startSession();
  s.startTransaction();
  try {
    const e = await Custom.aggregate([
      { $match: { userid: ua } },
      { $project: { _id: 0 } },
    ]).session(s);
    await s.commitTransaction(), s;
    s.endSession(), o.json(e[0]);
    // console.log("BADGES SENT");
  } catch (e) {
    await s.abortTransaction(),
      s.endSession(),
      console.error(e),
      o.status(500).json({ message: "An error occurred" });
  }
}),
  app.post("/notifications", authenticateToken, async (req, res) => {
    try {
      const { sender: s, recipient: r, message: t, type: a } = req.body;

      if (a === "friendRequest") {
        console.log("fr");
        // Check if recipient is already a friend
        const senderUser = await User.findOne({ email: s });
        const recipientUser = await User.findOne({ email: r });

        if (
          recipientUser &&
          recipientUser.friends.some((friend) => friend.email === s)
        ) {
          // console.log("already a friend");
          // The recipient is already a friend, send a response
          return res
            .status(200)
            .json({ message: "You are already friends with this user" });
        } else {
          const existingFriendRequest = await Notification.findOne({
            sender: s,
            recipient: r,
            type: "friendRequest",
            read: false,
          });

          if (existingFriendRequest) {
            // console.log("Friend request notification already sent");
            return res
              .status(202)
              .json({ message: "Friend request already sent" });
          }

          const senderUser = await User.findOne({ email: s });
          const notification = new Notification({
            sender: s,
            recipient: r,
            message: ` ${senderUser.username} ${t}`, // Concatenate sender's name with message
            type: a,
            pic: senderUser.pic, // Use sender's picture
          });

          await notification.save();
          const message = senderUser.username + "sent you a friend request!";
          sendPushNotification(recipientUser.fcmToken, message);
          res.status(201).json({ message: "Notification created" });
          // console.log("Notification created");
        }
      }
      if (a === "profileLike") {
        // Check if recipient is already a friend
        const recipientUser = await User.findOne({ email: r });
        const senderUser = await User.findOne({ email: s });
        const notification = new Notification({
          sender: s,
          recipient: r,
          message: `${senderUser.username} ${t}`, // Concatenate sender's name with message
          type: a,
          pic: senderUser.pic, // Use sender's picture
        });
        await notification.save();
        res.status(201).json({ message: "Notification created" });
        // console.log("Notification created");
      }
      if (a === "coins") {
        // Check if recipient is already a friend
        const recipientUser = await User.findOne({ email: r });
        const senderUser = await User.findOne({ email: s });
        const notification = new Notification({
          sender: s,
          recipient: r,
          message: `${senderUser.username} ${t}`, // Concatenate sender's name with message
          type: a,
          pic: senderUser.pic, // Use sender's picture
        });
        await notification.save();
        const message = senderUser.username + "has sent you a GIFT!";
        sendPushNotification(recipientUser.fcmToken, message);
        res.status(201).json({ message: "Notification created" });
        // console.log("Notification created");
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

app.post("/addfriend", authenticateToken, async (e, o) => {
  const {
    username: s,
    useremail: r,
    friendUsername: t,
    friendEmail: a,
  } = e.body;
  console.log(e.body);
  // console.log("friend req");
  try {
    const e = await User.findOne({ email: r });
    if (!e) return o.status(404).json({ error: "Sender not found" });
    const n = await User.findOne({ email: a });
    if (!n) return o.status(404).json({ error: "Receiver not found" });
    const i = { username: t, email: a },
      c = { username: s, email: e.email };
    e.friends.push(i),
      n.friends.push(c),
      await e.save(),
      await n.save(),
      o.status(200).json({ message: "Friend added successfully" });
  } catch (e) {
    console.error(e), o.status(500).json({ error: "Internal server error" });
  }
}),
  app.put("/updateposition", async (e, o) => {
    try {
      const { roomId1: s, userId: r, x: t, y: a } = e.body;
      // console.log(s, r, t, a);
      const n = await RoomModel.findOne({ roomId: s });
      if (!n) return o.status(404).json({ error: "Room not found" });
      const i = n.users.findIndex((e) => e === r);
      if (-1 === i)
        return o.status(404).json({ error: "User not found in the room" });
      n.coordinates[i]
        ? ((n.coordinates[i].x = t), (n.coordinates[i].y = a))
        : (n.coordinates[i] = { email: r, x: t, y: a }),
        await n.save(),
        o.status(200).json({ message: "User position updated successfully" });
    } catch (e) {
      console.error(e), o.status(500).json({ error: "Internal server error" });
    }
  }),
  app.get("/getusercoordinates", authenticateToken, async (e, o) => {
    try {
      const { roomId: s, userEmails: r } = e.query;
      if (!Array.isArray(r))
        return o.status(400).json({ error: "Invalid userEmails parameter" });
      const t = await RoomModel.findOne({ roomId: s });
      if (!t) return o.status(404).json({ error: "Room not found" });
      const a = t.coordinates
        .filter((e) => r.includes(e.email))
        .map((e) => ({ x: e.x, y: e.y, email: e.email }));
      if (0 === a.length)
        return o
          .status(404)
          .json({ error: "No matching users found in the room" });
      o.status(200).json(a);
    } catch (e) {
      console.error(e), o.status(500).json({ error: "Internal server error" });
    }
  }),
  app.put("/notifications/:notificationId/mark-as-read", async (e, o) => {
    const { notificationId: s } = e.params;
    try {
      const e = await Notification.findByIdAndUpdate(
        s,
        { read: !0 },
        { new: !0 }
      );
      if (!e) return o.status(404).json({ error: "Notification not found" });
      o.status(200).json({
        message: "Notification marked as read",
        notification: e,
      });
    } catch (e) {
      console.error("Error marking notification as read:", e),
        o.status(500).json({ error: "Internal server error" });
    }
  }),
  app.post("/changecolor", authenticateToken, async (req, res) => {
    const { user, hex } = req.body.det;
    // console.log("COLOR UPDATED "+user+ hex);
    try {
      // Find the user by their email and update the color
      const updatedUser = await User.findOneAndUpdate(
        { email: user },
        { chatcolor: hex },
        { new: true } // This option returns the updated document
      );

      if (updatedUser) {
        // User found and color updated
        // console.log("COLOR UPDATED " + user + hex);
        return res.status(200).json({ message: "Color updated successfully" });
      } else {
        // User not found
        return res.status(404).json({ error: "User not found" });
      }
    } catch (e) {
      console.error("Error updating color: " + e);
      return res
        .status(500)
        .json({ error: "An error occurred while updating the color" });
    }
  }),
  app.post("/changeusernamecolor", authenticateToken, async (req, res) => {
    const { user, hex } = req.body.det;
    // console.log("COLOR UPDATED "+user+ hex);
    try {
      // Find the user by their email and update the color
      const updatedUser = await User.findOneAndUpdate(
        { email: user },
        { usernamecolor: hex },
        { new: true } // This option returns the updated document
      );

      if (updatedUser) {
        // User found and color updated
        // console.log("COLOR UPDATED " + user + hex);
        return res.sendStatus(200);
      } else {
        // User not found
        return res.sendStatus(404);
      }
    } catch (e) {
      console.error("Error updating color: " + e);
      return res
        .status(500)
        .json({ error: "An error occurred while updating the color" });
    }
  }),
  // app.post("/muteuser", async (e, o) => {
  //     const { u: s, t: r, romid: t } = e.body.mutedata;
  //     try {
  //         const e = await mongoose.startSession();
  //         e.startTransaction();
  //         const o = await RoomModel.findOne({ roomId: t });
  //         o && (o.muted.push(s), o.muted.push(r), await o.save({ session: e })), await e.commitTransaction(), e.endSession(), console.log("Muted Sucessfully!");
  //         fetchAndSendUpdates(t)
  //     } catch (e) {
  //         console.log("error muting " + e);
  //     }
  // }),
  app.post("/muteuser", authenticateToken, async (req, res) => {
    const { u, t, roomid } = req.body.mutedata; // Assuming you have these values
    // console.log(u,t);
    try {
      const rooms = await RoomModel.find({});

      if (rooms && rooms.length > 0) {
        for (const room of rooms) {
          // Create a mute entry with the user and timestamp

          room.muted.push(u);
          room.muted.push(t);

          room.save();
          fetchAndSendUpdates(room.roomId);
        }

        // console.log("User muted in all rooms!");

        res.status(200).send("User muted in all rooms!");
      } else {
        // console.log("No rooms found");
        res.status(404).send("No rooms found");
      }
    } catch (error) {
      console.log("Error muting: " + error);
      res.status(500).send("Error muting: " + error);
    }
  });

app.post("/blockuser", authenticateToken, async (req, res) => {
  const { u: userToBlock, rx: roomId } = req.body.blockdata;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const room = await RoomModel.findOne({ roomId });

    if (room) {
      room.blocked.push(userToBlock);
      await room.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    // console.log("User Blocked Successfully!");

    // Assuming this function sends updates to the relevant parties
    // Make sure it's called at the appropriate place in your logic
    fetchAndSendUpdates(roomId);

    res.status(200).json({ message: "User Blocked Successfully!" });
  } catch (error) {
    console.error("Error Blocking User: " + error);

    // Handle the error, roll back the transaction if necessary
    res
      .status(500)
      .json({ error: "An error occurred while blocking the user." });
  }
});

app.post("/createroom", authenticateToken, async (req, res) => {
  const {
    usern,
    name,
    pic,
    bio,
    videoUrl,
    roomOwner,
    roomPrivacy,
    roomPass,
    bubble,
  } = req.body.roombody;

  let videoUrlx = [];
  if (videoUrl && videoUrl.length > 0) {
    for (let i = 0; i < videoUrl.length; i++) {
      if (videoUrl[i].includes("embed")) {
        videoUrlx.push(videoUrl[i]);
        continue;
      }

      var mylink = getlink(videoUrl[i]);
      if (mylink == null || mylink == "") {
        mylink = "";
      } else {
        if (!mylink.includes("backblaze")) {
          mylink = "https://www.youtube.com/embed/" + mylink;
        }
      }
      videoUrlx.push(mylink);
    }
  } else {
    videoUrlx = [
      "https://www.youtube.com/embed/BhUthi9HGjg?si=zufizUpqsTCinhpY",
    ];
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const coordinates = { email: usern, x: 215, y: 125 };
    const roomId = generateRandomString();

    const roomData = {
      roomId: roomId,
      name: name,
      coordinates: coordinates,
      badgeurl: pic,
      videourl: videoUrlx,
      bio: bio,
      mods: [usern], // Assuming room owner is also a moderator
      roomOwner: roomOwner,
      public: roomPrivacy,
      password: roomPass,
      bubble,
      bubble,
    };
    const newRoom = await RoomModel(roomData);
    await newRoom.save({ session });

    const currentTime = moment()
      .tz("Asia/Karachi")
      .format("YYYY-MM-DD HH:mm:ss");
    const initialMessages = {
      room_id: roomId,
      messages: [
        { user_id: usern, content: "xxrp7", time: currentTime },
        { user_id: usern, content: "xxrp7", time: currentTime },
        { user_id: usern, content: "xxrp7", time: currentTime },
      ],
    };
    const newMessage = new Message(initialMessages);
    await newMessage.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ stat: 200 });
  } catch (error) {
    console.log("Error Creating Room: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
}),
  app.post("/updatebadge", authenticateToken, async (e, o) => {
    const s = await mongoose.startSession();
    s.startTransaction();
    try {
      const { email: r, badgeUrl: t } = e.body.badgedata,
        a = await User.findOneAndUpdate(
          { email: r },
          { badge: t },
          { new: !0 }
        ).session(s);
      await s.commitTransaction(),
        s.endSession(),
        o.json({ message: "Badge updated successfully", user: a });
    } catch (e) {
      await s.abortTransaction(),
        s.endSession(),
        console.error(e),
        o.status(500).json({ message: "An error occurred" });
    }
  }),
  app.get("/notifications/:userId", authenticateToken, async (e, o) => {
    try {
      const { userId: s } = e.params,
        r = await Notification.find({ recipient: s, read: !1 }).populate(
          "sender"
        );
      o.status(200).json({ notifications: r });
    } catch (e) {
      console.error(e),
        o.status(500).json({ message: "Internal server error" });
    }
  }),
  app.post("/updateprofilepic", authenticateToken, async (e, o) => {
    const s = await mongoose.startSession();
    s.startTransaction();
    try {
      const { useremail: r, profileurl: t } = e.body.imgdata,
        a = await User.findOneAndUpdate(
          { email: r },
          { pic: t },
          { new: !0 }
        ).session(s);
      await s.commitTransaction(),
        s.endSession(),
        o.json({ message: "Profile Pic updated successfully", user: a });
      // for (const e of roomDataMap.keys()) fetchAndSendUpdates(e);
    } catch (e) {
      await s.abortTransaction(),
        s.endSession(),
        console.error(e),
        o.status(500).json({ message: "An error occurred" });
    }
  }),
  app.post("/loadbages", authenticateToken, async (e, o) => {
    const s = await mongoose.startSession();
    s.startTransaction();
    try {
      const e = await badgeModel
        .aggregate([{ $match: { badgeid: "123" } }, { $project: { _id: 0 } }])
        .session(s);
      await s.commitTransaction(), s.endSession(), o.json(e[0]);
      // console.log("BADGES SENT");
    } catch (e) {
      await s.abortTransaction(),
        s.endSession(),
        console.error(e),
        o.status(500).json({ message: "An error occurred" });
    }
  }),
  app.post("/updateroom", authenticateToken, async (e, o) => {
    const s = await mongoose.startSession();
    try {
      await s.withTransaction(async () => {
        const {
          roomid: r,
          pic: t,
          name: a,
          bio: n,
          videoUrl: i,
          bubble: b,
        } = e.body.roombody;
        console.log(e.body.roombody);
        videoUrls = [];
        for (let ix = 0; ix < i.length; ix++) {
          var mylink = i[ix];

          if (!i[ix].includes("backblaze")) {
            if (!i[ix].includes("embed")) {
              if (mylink == null || mylink == "" || mylink.length <= 6) {
                mylink = "";
              } else {
                mylink = getlink(i[ix]);
                console.log("myl: ", mylink);

                mylink = "https://www.youtube.com/embed/" + mylink;
              }
            }
          }
          videoUrls.push(mylink);
        }
        console.log("egge " + mylink);

        c = {};
        if (
          (t && (c.badgeurl = t),
          a && (c.name = a),
          n && (c.bio = n),
          i && (c.videourl = videoUrls),
          typeof b !== "undefined" && (c.bubble = b),
          !(await RoomModel.findOneAndUpdate(
            { roomId: r },
            { $set: c },
            { new: !0, session: s }
          )))
        )
          throw new Error("Room not found");

        console.log("Updated Room Data");
        o.json({ stat: 200 });
      });
    } catch (e) {
      console.log("Room Update Failed: " + e);
    } finally {
      s.endSession();
    }
  }),
  //endpoint to fetch the messages between two users in the chatRoom
  app.get(
    "/messages/:senderId/:recepientId",
    authenticateToken,
    async (req, res) => {
      try {
        const { senderId, recepientId } = req.params;
        console.log(senderId, recepientId);

        const messages = await PersonalMessage.find({
          $or: [
            { senderId: senderId, recepientId: recepientId },
            { senderId: recepientId, recepientId: senderId },
          ],
        }).sort({ timestamp: 1 });

        res.json(messages);
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  );

app.post("/deleteroom", authenticateToken, async (e, o) => {
  const { roomid: s } = e.body;
  try {
    if (!(await RoomModel.findOneAndDelete({ roomId: s })))
      return o.status(404).json({ error: "Room not found" });
    // console.log("Delete Room Success"),
    o.json({ s: 200 });
  } catch (e) {
    console.log("Room Deletion Failed: " + e),
      o.status(500).json({ error: "Room Deletion Failed" });
  }
});
app.post("/removeprofilepic", authenticateToken, async (e, o) => {
  const s = await mongoose.startSession();
  s.startTransaction();
  try {
    const { user } = e.body.a,
      a = await User.findOneAndUpdate(
        { email: user },
        { pic: "https://cdn-icons-png.flaticon.com/512/3177/3177440.png" },
        { new: !0 }
      ).session(s);
    await s.commitTransaction(),
      s.endSession(),
      // console.log("PROFILE REMOVED"),
      o.sendStatus(200);
    // for (const e of roomDataMap.keys()) fetchAndSendUpdates(e);
  } catch (e) {
    await s.abortTransaction(),
      s.endSession(),
      console.error(e),
      o.status(500).json({ message: "An error occurred" });
  }
}),
  app.post("/removebackpic", authenticateToken, async (e, o) => {
    const s = await mongoose.startSession();
    s.startTransaction();
    try {
      const { user } = e.body.a,
        a = await User.findOneAndUpdate(
          { email: user },
          {
            backgroundPic:
              "https://as2.ftcdn.net/v2/jpg/01/68/74/87/1000_F_168748763_Mdv7zO7dxuECMzItERhPzWhVJSaORTKd.jpg",
          },
          { new: !0 }
        ).session(s);
      await s.commitTransaction(),
        s.endSession(),
        // console.log("BACKGROUND REMOVED"),
        o.sendStatus(200);
      // for (const e of roomDataMap.keys()) fetchAndSendUpdates(e);
    } catch (e) {
      await s.abortTransaction(),
        s.endSession(),
        console.error(e),
        o.status(500).json({ message: "An error occurred" });
    }
  }),
  app.post("/removebio", authenticateToken, async (e, o) => {
    const s = await mongoose.startSession();
    s.startTransaction();
    try {
      const { user } = e.body.a,
        a = await User.findOneAndUpdate(
          { email: user },
          { bio: "Hi i am ChatZyr User!" },
          { new: !0 }
        ).session(s);
      await s.commitTransaction(),
        s.endSession(),
        // console.log("Bio REMOVED"),
        o.sendStatus(200);
      // for (const e of roomDataMap.keys()) fetchAndSendUpdates(e);
    } catch (e) {
      await s.abortTransaction(),
        s.endSession(),
        console.error(e),
        o.status(500).json({ message: "An error occurred" });
    }
  }),
  app.delete("/deleteAccount/:email", async (req, res) => {
    const { email } = req.params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Delete the user document from the User collection
      await User.findOneAndDelete({ email }).session(session);

      // Delete messages associated with the user from the Message model
      // const deletedMessages = await Message.deleteMany({ user_id: email }).session(session);
      // console.log(Deleted ${deletedMessages.deletedCount} documents.);
      // console.log(deletedMessages);

      // Delete notifications sent to or from the user from the Notification model
      await Notification.deleteMany({
        $or: [{ sender: email }, { recipient: email }],
      }).session(session);

      const modDocument = await Mods.findOne({
        $or: [{ mod1: email }, { mod2: email }],
      });

      if (modDocument) {
        // Remove the user from either mod1 or mod2
        if (modDocument.mod1.includes(email)) {
          modDocument.mod1 = modDocument.mod1.filter((user) => user !== email);
        } else {
          modDocument.mod2 = modDocument.mod2.filter((user) => user !== email);
        }

        // Save the updated document
        await modDocument.save();

        // console.log(Deleted user: ${email} from mods);
        // res.status(200).send(Deleted user: ${userToBeDeleted} from mods);
      } else {
        // console.log(User not found in mods);
        // res.status(404).send('User not found in mods`);
      }
      removeUserFromFriends(email);
      deletePerMessages(email);
      const result = await deleteMessages(email);

      deleteCoordinates(email);
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      // Respond with a success message

      // console.log("User deleted successfully.");
      res.status(200).json({
        message: "User account and associated data deleted successfully.",
      });
    } catch (error) {
      // Rollback the transaction in case of an error
      await session.abortTransaction();
      session.endSession();
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while deleting the user account." });
    }
  });

const normalizeString = (str) => {
  return str
    .replace(/[\s\W_]+/g, "") // Remove spaces, special characters
    .toLowerCase(); // Convert to lowercase
};

app.get("/search", authenticateToken, async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  const normalizedQuery = normalizeString(query);

  try {
    const users = await User.find({});
    const results = users.filter((user) => {
      const normalizedUsername = normalizeString(user.username);
      return normalizedUsername.includes(normalizedQuery);
    });

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/user", authenticateToken, async (req, res) => {
  try {
    const userEmail = req.query.email;

    if (!userEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find the user by their email in the MongoDB database
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user details in the response
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

server.listen(PORT, () => {
  console.log("Sockets Server listening on port " + PORT);
});
