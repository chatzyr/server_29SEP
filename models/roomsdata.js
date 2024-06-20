const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {type: String, unique:true},
    x: { type: Number, default: 215 },
    y: { type: Number, default: 125 },
  });


  userSchema.index({ email: 1 }, { unique: true });
const roomSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    users: { type: [String], default: [''] },
    coordinates: {type: [userSchema], default: ['']},
    mods: { type: [String], default: [''] },
    name: { type: String, required: true },
    muted: { type: [String], default: [''] },
    blocked: { type: [String], default: [''] },
    badgeurl: { type: String, default: 'https://icons.veryicon.com/png/o/media/home-furnishing-icon/room-1.png' },
    videourl: { type: String, default: '' },
    bio: { type: String, default: '' },
    likes: {type: Number, default:0},
    likedBy: [{ type: String, default:''}],
    roomOwner:{type: String, default: ''},
    public:{type: Boolean, default: true},
    password:{type:String,default:'123'}
});


const RoomModel = mongoose.model('Room', roomSchema);

module.exports = RoomModel;
