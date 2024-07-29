const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
    username: { type: String },
    email: { type: String, default: ''}, // Set the 'unique' property to true
});

const likeSchema = new mongoose.Schema({
    likedBy: { type: String, ref: 'User', required: true }
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    badge: { type: String, default: 'https://cdn-icons-png.flaticon.com/512/2955/2955010.png' },
    pic: { type: String, default: 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png' },
    backgroundPic: { type: String, default: 'https://as2.ftcdn.net/v2/jpg/01/68/74/87/1000_F_168748763_Mdv7zO7dxuECMzItERhPzWhVJSaORTKd.jpg' },
    bio: { type: String, default: 'Hey There! I am chatZyr user!' },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: String, ref: 'User'}], // Array to store user IDs who have liked this profile
    premium: {type: String, default:"false"},
    friends: [friendSchema],
    chatcolor: { type: String, default: '#FFFFFF' }, // Added chatcolor field
    usernamecolor: { type: String, default: '#FF0000' }, // Added chatcolor field
    balance:{type: Number, default: 0},
    status:{type:String,default:'Hey! This is my Status!!!'},
    BackImage: { type: String, default: 'https://raw.githubusercontent.com/chatzyr/chatzyr-background-Images/main/free/default.png' },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
