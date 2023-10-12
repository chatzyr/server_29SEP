
const express=require("express"),mongoose=require("mongoose"),bodyParser=require("body-parser"),moment=require("moment-timezone"),cors=require("cors"),WebSocket=require("ws"),http=require("http"),app=express(),PORT=process.env.PORT||3e3;app.use(cors({origin:!0,credentials:!0})),app.use(bodyParser.json());const{mongoUrl:mongoUrl}=require("./dbConnection"),RoomModel=require("./models/roomsdata"),Message=require("./models/message"),badgeModel=require("./models/badges"),User=require("./models/user"),Offer=require("./models/offermodal"),Mods=require("./models/mods"),PersonalMessage=require("./models/personalmessage"),userRoutes=require("./routes/userRoutes"),{connect:connect}=require("./models/user"),Notification=require("./models/notifications"),server=http.createServer(app);function generateRandomString(){let e="";for(let o=0;o<7;o++){const o=Math.floor(62*Math.random());e+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(o)}return e}mongoose.connect(mongoUrl,{useNewUrlParser:!0,useUnifiedTopology:!0}),mongoose.connection.on("connected",(()=>{console.log("DB connection successful")})),mongoose.connection.on("error",(e=>{console.log("DB connection failed",e)})),app.use(userRoutes),app.get("/fetchData",(async(e,o)=>{try{console.log("fetch data");const e=await RoomModel.find(),s=await Offer.aggregate([{$project:{_id:0,__v:0}}]),t=await Mods.aggregate([{$project:{_id:0,__v:0}}]),a={documents:e,offer:s[0],mymods:t};o.json(a)}catch(e){console.error("Error:",e),o.status(500).json({error:"Internal server error"})}})),app.post("/updatebackgroundpic",(async(e,o)=>{const s=await mongoose.startSession();s.startTransaction();try{const{useremail:t,profileurl:a}=e.body.imgdata,r=await User.findOneAndUpdate({email:t},{backgroundPic:a},{new:!0}).session(s);await s.commitTransaction(),s.endSession(),o.json({message:"Profile Pic updated successfully",user:r});for(const e of roomDataMap.keys())fetchAndSendUpdates(e)}catch(e){await s.abortTransaction(),s.endSession(),console.error(e),o.status(500).json({message:"An error occurred"})}})),app.get("/users/:email/profile",(async(e,o)=>{try{const s=e.params.email;console.log(s);const t=await User.findOne({email:s});if(!t)return o.status(404).json({message:"User not found"});o.status(200).json(t)}catch(e){console.error(e),o.status(500).json({message:"Server error"})}app.put("/users/:email/updateprofile",(async(e,o)=>{try{const s=e.params.email,{username:t,bio:a}=e.body,r=await User.findOne({email:s});if(!r)return o.status(404).json({message:"User not found"});r.username=t,r.bio=a,await r.save(),o.status(200).json({message:"User updated successfully"})}catch(e){console.error(e),o.status(500).json({message:"Server error"})}}))})),app.post("/users/:userId/increment-likes",(async(e,o)=>{const{userId:s}=e.params,{user:t}=e.body;try{const e=await User.findOne({email:s});if(!e)return o.status(404).json({message:"User not found"});if(e.likedBy.includes(t))return o.status(400).json({message:"You have already liked this profile"});e.likes+=1,e.likedBy.push(t),await e.save();for(const e of roomDataMap.keys())fetchAndSendUpdates(e);return o.status(200).json({user:e})}catch(e){return console.error(e),o.status(500).json({message:"Internal server error"})}})),app.post("/warning-notifications",(async(e,o)=>{try{const{sender:s,recipients:t,message:a,type:r,pic:n}=e.body,i=t.map((async e=>{const o=new Notification({sender:s,recipient:e,message:a,type:r,pic:n});return await o.save(),o}));await Promise.all(i),o.status(201).json({message:"Notifications created"}),console.log("Notifications created")}catch(e){console.error(e),o.status(500).json({message:"Internal server error"})}})),app.post("/notifications",(async(e,o)=>{try{const{sender:s,recipient:t,message:a,type:r,pic:n}=e.body;if("friendRequest"===r){const e=await User.findOne({email:t});if(e&&e.friends.some((e=>e.email===s)))return console.log("already a friend"),o.status(200).json({message:"You are already friends with this user"});{const e=new Notification({sender:s,recipient:t,message:a,type:r,pic:n});await e.save(),o.status(201).json({message:"Notification created"}),console.log("Notification created")}}if("profileLike"===r){await User.findOne({email:t});const e=new Notification({sender:s,recipient:t,message:a,type:r,pic:n});await e.save(),o.status(201).json({message:"Notification created"}),console.log("Notification created")}}catch(e){console.error(e),o.status(500).json({message:"Internal server error"})}})),app.post("/addfriend",(async(e,o)=>{const{username:s,useremail:t,friendUsername:a,friendEmail:r}=e.body;console.log("friend req");try{const e=await User.findOne({email:t});if(!e)return o.status(404).json({error:"Sender not found"});const n=await User.findOne({email:r});if(!n)return o.status(404).json({error:"Receiver not found"});const i={username:a,email:r},c={username:s,email:e.email};e.friends.push(i),n.friends.push(c),await e.save(),await n.save(),o.status(200).json({message:"Friend added successfully"})}catch(e){console.error(e),o.status(500).json({error:"Internal server error"})}})),app.put("/updateposition",(async(e,o)=>{try{const{roomId1:s,userId:t,x:a,y:r}=e.body;console.log(s,t,a,r);const n=await RoomModel.findOne({roomId:s});if(!n)return o.status(404).json({error:"Room not found"});const i=n.users.findIndex((e=>e===t));if(console.log(i),-1===i)return o.status(404).json({error:"User not found in the room"});n.coordinates[i]?(n.coordinates[i].x=a,n.coordinates[i].y=r):n.coordinates[i]={email:t,x:a,y:r},await n.save(),o.status(200).json({message:"User position updated successfully"})}catch(e){console.error(e),o.status(500).json({error:"Internal server error"})}})),app.get("/getusercoordinates",(async(e,o)=>{try{const{roomId:s,userEmails:t}=e.query;if(!Array.isArray(t))return o.status(400).json({error:"Invalid userEmails parameter"});const a=await RoomModel.findOne({roomId:s});if(!a)return o.status(404).json({error:"Room not found"});const r=a.coordinates.filter((e=>t.includes(e.email))).map((e=>({x:e.x,y:e.y,email:e.email})));if(0===r.length)return o.status(404).json({error:"No matching users found in the room"});o.status(200).json(r)}catch(e){console.error(e),o.status(500).json({error:"Internal server error"})}})),app.put("/notifications/:notificationId/mark-as-read",(async(e,o)=>{const{notificationId:s}=e.params;try{const e=await Notification.findByIdAndUpdate(s,{read:!0},{new:!0});if(!e)return o.status(404).json({error:"Notification not found"});o.status(200).json({message:"Notification marked as read",notification:e})}catch(e){console.error("Error marking notification as read:",e),o.status(500).json({error:"Internal server error"})}})),app.get("/users/:userId/friends",(async(e,o)=>{try{const s=e.params.userId,t=await User.findOne({email:s});if(!t)return o.status(404).json({message:"User not found"});const a=t.friends.map((e=>e.email)),r=await User.find({email:{$in:a}});o.json({friends:r})}catch(e){console.error("Error fetching user friends:",e),o.status(500).json({message:"Internal server error"})}})),app.get("/notifications/:userId",(async(e,o)=>{try{const{userId:s}=e.params,t=await Notification.find({recipient:s,read:!1}).populate("sender");o.status(200).json({notifications:t})}catch(e){console.error(e),o.status(500).json({message:"Internal server error"})}})),app.post("/muteuser",(async(e,o)=>{const{u:s,t:t,romid:a}=e.body.mutedata;try{const e=await mongoose.startSession();e.startTransaction();const o=await RoomModel.findOne({roomId:a});o&&(o.muted.push(s),o.muted.push(t),await o.save({session:e})),await e.commitTransaction(),e.endSession(),console.log("Muted Sucessfully!");for(const e of roomDataMap.keys())fetchAndSendUpdates(e)}catch(e){console.log("error muting "+e)}})),app.post("/blockuser",(async(e,o)=>{const{u:s,rx:t}=e.body.blockdata;try{const e=await mongoose.startSession();e.startTransaction();const o=await RoomModel.findOne({roomId:t});o&&(o.blocked.push(s),await o.save({session:e})),await e.commitTransaction(),e.endSession(),console.log("User Blocked Sucessfully!");for(const e of roomDataMap.keys())fetchAndSendUpdates(e)}catch(e){console.log("error Blocking user:  "+e)}})),app.post("/createroom",(async(e,o)=>{const{name:s,pic:t,bio:a,videoUrl:r,usern:n}=e.body.roombody;console.log("HEEE"+s,t,a,r,n),o.send(200);try{const e=await mongoose.startSession();e.startTransaction();const o={email:n,x:215,y:125},i=generateRandomString(),c={roomId:i,name:s,coordinates:o,badgeurl:t,videourl:r,bio:a,mods:[n]},d=await RoomModel(c);await d.save({session:e});const m=moment().tz("Asia/Karachi").format("YYYY-MM-DD HH:mm:ss"),l=new Message({room_id:i,messages:[{user_id:n,content:"xxrp7",time:m},{user_id:n,content:"xxrp7",time:m},{user_id:n,content:"xxrp7",time:m}]});await l.save({session:e}),console.log("Initialized Room Chat..."),await e.commitTransaction(),e.endSession(),console.log("Room Created Sucessfully!")}catch(e){console.log("Error Creating Room :  "+e)}}));const wss=new WebSocket.Server({server:server}),roomDataMap=new Map;async function fetchAndSendUpdates(e){try{const o=await getfromdb(e);(roomDataMap.get(e)||[]).forEach((e=>{e.readyState===WebSocket.OPEN&&e.send(JSON.stringify(o))}))}catch(e){console.error("Error fetching and sending updates:",e)}}const connections=new Set;async function addservermessage(e,o){const s=e,t=o,a=moment().tz("Asia/Karachi").format("YYYY-MM-DD HH:mm:ss");try{const e=await RoomModel.findOne({roomId:t});if(!e)throw console.error("Room not found"),new Error("Room not found");const o=s.user_id;e.coordinates.some((e=>e.email===o))?console.log("Coordinates already exist."):(console.log("Adding coordinates from function"),e.coordinates.push({email:o,x:215,y:125}),await e.save(),console.log("Coordinates added successfully."));let r=await Message.findOne({room_id:t});if(!r){console.error("Room not found"),r=new Message({room_id:t,messages:[]}),await r.save(),console.log("Created New Chat...");for(const e of roomDataMap.keys())fetchAndSendUpdates(e)}if(r){r.messages=r.messages.filter((e=>"xxrp7"!==e.content));const e={user_id:s.user_id,content:s.content,time:a};if(r.messages.push(e),r.messages.length>60){const e=r.messages.length-60;r.messages.splice(0,e)}await r.save();for(const e of roomDataMap.keys())fetchAndSendUpdates(e);console.log("UPDATED ROOM MESS To 60")}console.log("Operation completed successfully")}catch(e){console.error("Error:",e)}}async function getfromdb(e){try{const o=e,s=await Message.aggregate([{$match:{room_id:o}},{$project:{_id:0,room_id:1,messages:{$map:{input:"$messages",as:"message",in:{user_id:"$$message.user_id",content:"$$message.content",time:"$$message.time"}}}}}]);let t=[];void 0!==s[0]&&(t=[...new Set(s[0].messages.map((e=>e.user_id)))]);const a=await User.aggregate([{$match:{email:{$in:t}}},{$project:{_id:0}}]),r=await RoomModel.aggregate([{$match:{roomId:o}},{$project:{_id:0}}]),n=a.reduce(((e,o)=>{const{username:s,password:t,email:a,badge:r,pic:n,backgroundPic:i,bio:c,likes:d,friends:m,premium:l}=o;return e[a]={name:s,email:a,password:t,badge:r,pic:n,backgroundPic:i,bio:c,likes:d,friends:m,preminum:l},e}),{});RoomModel.updateMany({},{$set:{users:t}}).then((e=>{})).catch((e=>{console.error("Error updating users:",e)})),RoomModel.updateMany({"coordinates.x":{$exists:!1},"coordinates.y":{$exists:!1}},{$set:{"coordinates.x":215,"coordinates.y":125}}).then((e=>{})).catch((e=>{console.error("Error updating coordinates:",e)}));const i=await Mods.aggregate([{$project:{_id:0}}]),c={...r[0],users:t,activemods:i};for(const e of roomDataMap.keys());return{mess:s[0],userdetails:n,roomdata:c}}catch(e){throw console.error("Error in getfromdb:",e),e}}async function updateCoordinatesWithRetry(e,o,s,t){const a=await RoomModel.findOne({roomId:e});if(!a)throw new Error("Room Not Found!");const r=a.coordinates.findIndex((e=>e.email===o));if(console.log("INDEX IS "+r),-1===r)throw new Error("User Not Found!");a.coordinates[r]?(a.coordinates[r].x=s,a.coordinates[r].y=t,console.log("UPDATING COORD")):a.coordinates[r]={email:o,x:s,y:t},await a.save();for(const e of roomDataMap.keys())fetchAndSendUpdates(e);console.log("COORDINATES UPDATES SUCESSFULLY "+s,t)}wss.on("connection",(e=>{connections.add(e),console.log("WebSocket client connected"),e.on("message",(async o=>{try{if(""==o)return null;const s=JSON.parse(o);if("text"===s.messageType)try{const{senderId:o,recipientId:t,messageType:a,message:r}=s;console.log(o,t);const n=new PersonalMessage({senderId:o,recepientId:t,messageType:a,message:r,timestamp:new Date});await n.save(),console.log("message sent!"),wss.clients.forEach((o=>{o!==e&&o.readyState===WebSocket.OPEN&&o.send(JSON.stringify(n))}))}catch(e){console.error("Error saving chat message:",e)}if("getMessages"===s.action){const{senderEmail:o,recipientEmail:t}=s.data,a=await PersonalMessage.find({$or:[{senderId:o,recepientId:t},{senderId:t,recepientId:o}]}).sort({timestamp:1});e.send(JSON.stringify(a))}if("x"in s){const{roomId1:e,userId:o,x:t,y:a}=s;try{console.log("ROOM ID "+e),console.log("USER ID "+o),await updateCoordinatesWithRetry(e,o,t,a)}catch(e){console.error("Failed to update coordinates inside sockets",e)}}else if("roomId"in s){const o=s.roomId;roomDataMap.has(o)||roomDataMap.set(o,[]),roomDataMap.get(o).push(e),fetchAndSendUpdates(o)}else"room_id"in s&&addservermessage(s.mymessage,s.room_id)}catch(e){console.error("Error parsing JSON:",e)}})),e.on("close",(()=>{connections.delete(e),console.log("WebSocket client disconnected")}))})),app.post("/updatebadge",(async(e,o)=>{const s=await mongoose.startSession();s.startTransaction();try{const{email:t,badgeUrl:a}=e.body.badgedata,r=await User.findOneAndUpdate({email:t},{badge:a},{new:!0}).session(s);await s.commitTransaction(),s.endSession(),o.json({message:"Badge updated successfully",user:r})}catch(e){await s.abortTransaction(),s.endSession(),console.error(e),o.status(500).json({message:"An error occurred"})}})),app.post("/updateprofilepic",(async(e,o)=>{const s=await mongoose.startSession();s.startTransaction();try{const{useremail:t,profileurl:a}=e.body.imgdata,r=await User.findOneAndUpdate({email:t},{pic:a},{new:!0}).session(s);await s.commitTransaction(),s.endSession(),o.json({message:"Profile Pic updated successfully",user:r});for(const e of roomDataMap.keys())fetchAndSendUpdates(e)}catch(e){await s.abortTransaction(),s.endSession(),console.error(e),o.status(500).json({message:"An error occurred"})}})),app.post("/loadbages",(async(e,o)=>{const s=await mongoose.startSession();s.startTransaction();try{const e=await badgeModel.aggregate([{$match:{badgeid:"123"}},{$project:{_id:0}}]).session(s);await s.commitTransaction(),s.endSession(),o.json(e[0]),console.log("BADGES SENT")}catch(e){await s.abortTransaction(),s.endSession(),console.error(e),o.status(500).json({message:"An error occurred"})}})),app.post("/updateroom",(async(e,o)=>{const s=await mongoose.startSession();try{await s.withTransaction((async()=>{const{roomid:t,pic:a,name:r,bio:n,videoUrl:i}=e.body.roombody,c={};if(a&&(c.badgeurl=a),r&&(c.name=r),n&&(c.bio=n),i&&(c.videourl=i),!await RoomModel.findOneAndUpdate({roomId:t},{$set:c},{new:!0,session:s}))throw new Error("Room not found");o.send("1"),console.log("Updated Room Data")}))}catch(e){console.log("Room Update Failed: "+e)}finally{s.endSession()}})),app.post("/deleteroom",(async(e,o)=>{const{roomid:s}=e.body;try{if(!await RoomModel.findOneAndDelete({roomId:s}))return o.status(404).json({error:"Room not found"});console.log("Delete Room Success"),o.json({s:200})}catch(e){console.log("Room Deletion Failed: "+e),o.status(500).json({error:"Room Deletion Failed"})}})),server.listen(PORT,(()=>{console.log("Sockets Server listening on port "+PORT)}));
