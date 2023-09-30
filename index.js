const express=require("express"),mongoose=require("mongoose"),bodyParser=require("body-parser"),moment=require("moment-timezone"),cors=require("cors"),WebSocket=require("ws"),http=require("http"),app=express(),PORT=process.env.PORT||3e3;app.use(cors({origin:!0,credentials:!0})),app.use(bodyParser.json());const{mongoUrl:mongoUrl}=require("./dbConnection"),RoomModel=require("./models/roomsdata"),Message=require("./models/message"),badgeModel=require("./models/badges"),User=require("./models/user"),Offer=require("./models/offermodal"),Mods=require("./models/mods"),userRoutes=require("./routes/userRoutes"),{connect:connect}=require("./models/user"),Notification=require("./models/notifications"),server=http.createServer(app);function generateRandomString(){let e="";for(let o=0;o<7;o++){const o=Math.floor(62*Math.random());e+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(o)}return e}mongoose.connect(mongoUrl,{useNewUrlParser:!0,useUnifiedTopology:!0}),mongoose.connection.on("connected",(()=>{console.log("DB connection successful")})),mongoose.connection.on("error",(e=>{console.log("DB connection failed",e)})),app.use(userRoutes),app.get("/fetchData",(async(e,o)=>{try{console.log("fetch data");const e=await RoomModel.find(),s=await Offer.aggregate([{$project:{_id:0,__v:0}}]),r=await Mods.aggregate([{$project:{_id:0,__v:0}}]),t={documents:e,offer:s[0],mymods:r};o.json(t)}catch(e){console.error("Error:",e),o.status(500).json({error:"Internal server error"})}})),app.post("/updatebackgroundpic",(async(e,o)=>{const s=await mongoose.startSession();s.startTransaction();try{const{useremail:r,profileurl:t}=e.body.imgdata,n=await User.findOneAndUpdate({email:r},{backgroundPic:t},{new:!0}).session(s);await s.commitTransaction(),s.endSession(),o.json({message:"Profile Pic updated successfully",user:n})}catch(e){await s.abortTransaction(),s.endSession(),console.error(e),o.status(500).json({message:"An error occurred"})}})),app.get("/users/:email/profile",(async(e,o)=>{try{const s=e.params.email;console.log(s);const r=await User.findOne({email:s});if(!r)return o.status(404).json({message:"User not found"});o.status(200).json(r)}catch(e){console.error(e),o.status(500).json({message:"Server error"})}app.put("/users/:email/updateprofile",(async(e,o)=>{try{const s=e.params.email,{username:r,bio:t}=e.body,n=await User.findOne({email:s});if(!n)return o.status(404).json({message:"User not found"});n.username=r,n.bio=t,await n.save(),o.status(200).json({message:"User updated successfully"})}catch(e){console.error(e),o.status(500).json({message:"Server error"})}}))})),app.post("/users/:userId/increment-likes",(async(e,o)=>{const{userId:s}=e.params;try{const e=await User.findOneAndUpdate({email:s},{$inc:{likes:1}},{new:!0});return e?o.status(200).json({user:e}):o.status(404).json({message:"User not found"})}catch(e){return console.error(e),o.status(500).json({message:"Internal server error"})}})),app.post("/warning-notifications",(async(e,o)=>{try{const{sender:s,recipients:r,message:t,type:n,pic:a}=e.body,i=r.map((async e=>{const o=new Notification({sender:s,recipient:e,message:t,type:n,pic:a});return await o.save(),o}));await Promise.all(i),o.status(201).json({message:"Notifications created"}),console.log("Notifications created")}catch(e){console.error(e),o.status(500).json({message:"Internal server error"})}})),app.post("/notifications",(async(e,o)=>{try{const{sender:s,recipient:r,message:t,type:n,pic:a}=e.body,i=new Notification({sender:s,recipient:r,message:t,type:n,pic:a});await i.save(),o.status(201).json({message:"Notification created"}),console.log("Notification created")}catch(e){console.error(e),o.status(500).json({message:"Internal server error"})}})),app.post("/addfriend",(async(e,o)=>{const{username:s,useremail:r,friendUsername:t,friendEmail:n}=e.body;console.log("friend req");try{const e=await User.findOne({email:r});if(!e)return o.status(404).json({error:"Sender not found"});const a=await User.findOne({email:n});if(!a)return o.status(404).json({error:"Receiver not found"});const i={username:t,email:n},c={username:s,email:e.email};e.friends.push(i),a.friends.push(c),await e.save(),await a.save(),o.status(200).json({message:"Friend added successfully"})}catch(e){console.error(e),o.status(500).json({error:"Internal server error"})}})),app.put("/updateposition",(async(e,o)=>{try{const{roomId1:s,userId:r,x:t,y:n}=e.body;console.log(s,r,t,n);const a=await RoomModel.findOne({roomId:s});if(!a)return o.status(404).json({error:"Room not found"});const i=a.users.findIndex((e=>e===r));if(console.log(i),-1===i)return o.status(404).json({error:"User not found in the room"});a.coordinates[i]?(a.coordinates[i].x=t,a.coordinates[i].y=n):a.coordinates[i]={email:r,x:t,y:n},await a.save(),o.status(200).json({message:"User position updated successfully"})}catch(e){console.error(e),o.status(500).json({error:"Internal server error"})}})),app.get("/getusercoordinates",(async(e,o)=>{try{const{roomId:s,userEmails:r}=e.query;if(!Array.isArray(r))return o.status(400).json({error:"Invalid userEmails parameter"});const t=await RoomModel.findOne({roomId:s});if(!t)return o.status(404).json({error:"Room not found"});const n=t.coordinates.filter((e=>r.includes(e.email))).map((e=>({x:e.x,y:e.y,email:e.email})));if(0===n.length)return o.status(404).json({error:"No matching users found in the room"});o.status(200).json(n)}catch(e){console.error(e),o.status(500).json({error:"Internal server error"})}})),app.put("/notifications/:notificationId/mark-as-read",(async(e,o)=>{const{notificationId:s}=e.params;try{const e=await Notification.findByIdAndUpdate(s,{read:!0},{new:!0});if(!e)return o.status(404).json({error:"Notification not found"});o.status(200).json({message:"Notification marked as read",notification:e})}catch(e){console.error("Error marking notification as read:",e),o.status(500).json({error:"Internal server error"})}})),app.get("/users/:userId/friends",(async(e,o)=>{try{const s=e.params.userId,r=await User.findOne({email:s});if(!r)return o.status(404).json({message:"User not found"});const t=r.friends;o.json({friends:t})}catch(e){console.error("Error fetching user friends:",e),o.status(500).json({message:"Internal server error"})}})),app.get("/notifications/:userId",(async(e,o)=>{try{const{userId:s}=e.params,r=await Notification.find({recipient:s,read:!1}).populate("sender");o.status(200).json({notifications:r})}catch(e){console.error(e),o.status(500).json({message:"Internal server error"})}})),app.post("/muteuser",(async(e,o)=>{const{u:s,t:r,romid:t}=e.body.mutedata;try{const e=await mongoose.startSession();e.startTransaction();const o=await RoomModel.findOne({roomId:t});o&&(o.muted.push(s),o.muted.push(r),await o.save({session:e})),await e.commitTransaction(),e.endSession(),console.log("Muted Sucessfully!")}catch(e){console.log("error muting "+e)}})),app.post("/blockuser",(async(e,o)=>{const{u:s,rx:r}=e.body.blockdata;try{const e=await mongoose.startSession();e.startTransaction();const o=await RoomModel.findOne({roomId:r});o&&(o.blocked.push(s),await o.save({session:e})),await e.commitTransaction(),e.endSession(),console.log("User Blocked Sucessfully!")}catch(e){console.log("error Blocking user:  "+e)}})),app.post("/createroom",(async(e,o)=>{const{name:s,pic:r,bio:t,videoUrl:n,usern:a}=e.body.roombody;var i=getlink(n);i=null==i||""==i?"":"https://www.youtube.com/embed/"+i;try{const e=await mongoose.startSession();e.startTransaction();const n={email:a,x:215,y:125},c=generateRandomString(),d={roomId:c,name:s,coordinates:n,badgeurl:r,videourl:i,bio:t,mods:[a]},m=await RoomModel(d);await m.save({session:e});const l=moment().tz("Asia/Karachi").format("YYYY-MM-DD HH:mm:ss"),u=new Message({room_id:c,messages:[{user_id:a,content:"xxrp7",time:l},{user_id:a,content:"xxrp7",time:l},{user_id:a,content:"xxrp7",time:l}]});await u.save({session:e}),console.log("Initialized Room Chat..."),await e.commitTransaction(),e.endSession(),console.log("Room Created Sucessfully!"),o.json({stat:200})}catch(e){console.log("Error Creating Room :  "+e)}}));const wss=new WebSocket.Server({server:server}),roomDataMap=new Map;async function fetchAndSendUpdates(e){try{const o=await getfromdb(e);(roomDataMap.get(e)||[]).forEach((e=>{e.readyState===WebSocket.OPEN&&e.send(JSON.stringify(o))}))}catch(o){console.error(`Error in background data retrieval for room ${e}:`,o)}}setInterval((()=>{for(const e of roomDataMap.keys())fetchAndSendUpdates(e)}),2e3);const connections=new Set;async function updateCoordinatesWithRetry(e,o,s,r){const t=await RoomModel.findOne({roomId:e});if(!t)throw new Error("Room Not Found!");const n=t.coordinates.findIndex((e=>e.email===o));if(console.log("INDEX IS "+n),-1===n)throw new Error("User Not Found!");t.coordinates[n]?(t.coordinates[n].x=s,t.coordinates[n].y=r,console.log("UPDATING COORD")):t.coordinates[n]={email:o,x:s,y:r},await t.save(),console.log("COORDINATES UPDATES SUCESSFULLY "+s,r)}async function addservermessage(e,o){const s=e,r=o,t=moment().tz("Asia/Karachi").format("YYYY-MM-DD HH:mm:ss");try{const e=await RoomModel.findOne({roomId:r});if(!e)throw console.error("Room not found"),new Error("Room not found");const o=s.user_id;e.coordinates.some((e=>e.email===o))?console.log("Coordinates already exist."):(console.log("Adding coordinates from function"),e.coordinates.push({email:o,x:215,y:125}),await e.save(),console.log("Coordinates added successfully."));let n=await Message.findOne({room_id:r});if(n||(console.error("Room not found"),n=new Message({room_id:r,messages:[]}),await n.save(),console.log("Created New Chat...")),n){n.messages=n.messages.filter((e=>"xxrp7"!==e.content));const e={user_id:s.user_id,content:s.content,time:t};if(n.messages.push(e),n.messages.length>60){const e=n.messages.length-60;n.messages.splice(0,e)}await n.save(),console.log("UPDATED ROOM MESS To 60")}console.log("Operation completed successfully")}catch(e){console.error("Error:",e)}}function getlink(e){var o=e.indexOf("v=");if(-1!==o){o+=2;var s=e.indexOf("&",o);return-1!==s?e.substring(o,s):e.substring(o)}{const o=e.match(/youtu\.be\/(.*?)\?/);if(o){const e=o[1];return console.log("be wala link "+e),e}{console.log("No match found. of be");const o=e.match(/live\/(.*?)\?/);return o?o[1]:null}}}async function getfromdb(e){try{const o=e,s=await Message.aggregate([{$match:{room_id:o}},{$project:{_id:0,room_id:1,messages:{$map:{input:"$messages",as:"message",in:{user_id:"$$message.user_id",content:"$$message.content",time:"$$message.time"}}}}}]);let r=[];void 0!==s[0]&&(r=[...new Set(s[0].messages.map((e=>e.user_id)))]);const t=await User.aggregate([{$match:{email:{$in:r}}},{$project:{_id:0}}]),n=await RoomModel.aggregate([{$match:{roomId:o}},{$project:{_id:0}}]),a=t.reduce(((e,o)=>{const{username:s,password:r,email:t,badge:n,pic:a,backgroundPic:i,bio:c,likes:d,friends:m,premium:l}=o;return e[t]={name:s,email:t,password:r,badge:n,pic:a,backgroundPic:i,bio:c,likes:d,friends:m,preminum:l},e}),{});RoomModel.updateMany({},{$set:{users:r}}).then((e=>{})).catch((e=>{console.error("Error updating users:",e)})),RoomModel.updateMany({"coordinates.x":{$exists:!1},"coordinates.y":{$exists:!1}},{$set:{"coordinates.x":215,"coordinates.y":125}}).then((e=>{})).catch((e=>{console.error("Error updating coordinates:",e)}));const i=await Mods.aggregate([{$project:{_id:0}}]),c={...n[0],users:r,activemods:i};return{mess:s[0],userdetails:a,roomdata:c}}catch(e){throw console.error("Error in getfromdb:",e),e}}wss.on("connection",(e=>{connections.add(e),console.log("WebSocket client connected"),e.on("message",(async o=>{try{const s=JSON.parse(o);if("x"in s){const{roomId1:e,userId:o,x:r,y:t}=s;try{await updateCoordinatesWithRetry(e,o,r,t)}catch(e){console.error("Failed to update coordinates inside sockets",e)}}else if("roomId"in s){const o=s.roomId;roomDataMap.has(o)||roomDataMap.set(o,[]),roomDataMap.get(o).push(e),fetchAndSendUpdates(o)}else"room_id"in s&&addservermessage(s.mymessage,s.room_id)}catch(e){console.error("Error parsing JSON:",e)}})),e.on("close",(()=>{connections.delete(e),console.log("WebSocket client disconnected")}))})),app.post("/updatebadge",(async(e,o)=>{const s=await mongoose.startSession();s.startTransaction();try{const{email:r,badgeUrl:t}=e.body.badgedata,n=await User.findOneAndUpdate({email:r},{badge:t},{new:!0}).session(s);await s.commitTransaction(),s.endSession(),o.json({message:"Badge updated successfully",user:n})}catch(e){await s.abortTransaction(),s.endSession(),console.error(e),o.status(500).json({message:"An error occurred"})}})),app.post("/updateprofilepic",(async(e,o)=>{const s=await mongoose.startSession();s.startTransaction();try{const{useremail:r,profileurl:t}=e.body.imgdata,n=await User.findOneAndUpdate({email:r},{pic:t},{new:!0}).session(s);await s.commitTransaction(),s.endSession(),o.json({message:"Profile Pic updated successfully",user:n})}catch(e){await s.abortTransaction(),s.endSession(),console.error(e),o.status(500).json({message:"An error occurred"})}})),app.post("/loadbages",(async(e,o)=>{const s=await mongoose.startSession();s.startTransaction();try{const e=await badgeModel.aggregate([{$match:{badgeid:"123"}},{$project:{_id:0}}]).session(s);await s.commitTransaction(),s.endSession(),o.json(e[0]),console.log("BADGES SENT")}catch(e){await s.abortTransaction(),s.endSession(),console.error(e),o.status(500).json({message:"An error occurred"})}})),app.post("/updateroom",(async(e,o)=>{const s=await mongoose.startSession();try{await s.withTransaction((async()=>{const{roomid:r,pic:t,name:n,bio:a,videoUrl:i}=e.body.roombody;var d=getlink(i);if(d=null==d||""==d?"":"https://www.youtube.com/embed/"+d,c={},t&&(c.badgeurl=t),n&&(c.name=n),a&&(c.bio=a),i&&(c.videourl=d),!await RoomModel.findOneAndUpdate({roomId:r},{$set:c},{new:!0,session:s}))throw new Error("Room not found");console.log("Updated Room Data"),o.json({stat:200})}))}catch(e){console.log("Room Update Failed: "+e)}finally{s.endSession()}})),app.post("/deleteroom",(async(e,o)=>{const{roomid:s}=e.body;try{if(!await RoomModel.findOneAndDelete({roomId:s}))return o.status(404).json({error:"Room not found"});console.log("Delete Room Success"),o.json({s:200})}catch(e){console.log("Room Deletion Failed: "+e),o.status(500).json({error:"Room Deletion Failed"})}})),server.listen(PORT,(()=>{console.log("Sockets Server listening on port "+PORT)}));
