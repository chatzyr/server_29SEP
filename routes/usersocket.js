const WebSocket = require('ws');
const User = require('../models/user'); // Assuming this is your User model path
const RoomModel = require('../models/roomsdata'); // Assuming this is your Room model path

// Store active connections
const connections = new Map();
const roomConnections = new Map();

function initializeWebSocketServer(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', async (ws) => {
        let userEmail = '';
        let currentRoomId = '';

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                
                switch(data.type) {
                    case 'join_room':
                        await handleRoomJoin(ws, data);
                        userEmail = data.email;
                        currentRoomId = data.roomId;
                        break;
                    
                    case 'leave_room':
                        await handleRoomLeave(ws, data);
                        break;
                    
                    case 'update_position':
                        await handlePositionUpdate(data);
                        break;
                }
            } catch (error) {
                console.error('WebSocket message handling error:', error);
                ws.send(JSON.stringify({ type: 'error', message: error.message }));
            }
        });

        ws.on('close', async () => {
            if (userEmail && currentRoomId) {
                await handleRoomLeave(ws, { email: userEmail, roomId: currentRoomId });
            }
            connections.delete(ws);
        });
    });
}

async function handleRoomJoin(ws, data) {
    const { email, roomId } = data;
    
    // Validate room exists
    const room = await RoomModel.findOne({ roomId });
    if (!room) {
        throw new Error('Room not found');
    }

    // Get user details
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('User not found');
    }

    // Store connection
    connections.set(ws, { email, roomId });
    
    // Add to room connections
    if (!roomConnections.has(roomId)) {
        roomConnections.set(roomId, new Map());
    }
    const roomUsers = roomConnections.get(roomId);
    roomUsers.set(email, {
        backgroundPic: user.backgroundPic || 'https://default-background-url.com',
        badge: user.badge || 'https://default-badge-url.com',
        bio: user.bio || '',
        chatcolor: user.chatcolor || '#FFFFFF',
        email: user.email,
        friends: user.friends || [],
        likes: user.likes || 0,
        name: user.username,
        password: user.password,
        pic: user.pic || 'https://default-pic-url.com',
        premium: user.premium || 'false',
        usernamecolor: user.usernamecolor || '#FF0000',
        x: data.x || 215,
        y: data.y || 125
    });

    // Broadcast updated user list to all clients in the room
    broadcastRoomUsers(roomId);
}

async function handleRoomLeave(ws, data) {
    const { email, roomId } = data;
    
    // Remove from room connections
    if (roomConnections.has(roomId)) {
        const roomUsers = roomConnections.get(roomId);
        roomUsers.delete(email);
        
        if (roomUsers.size === 0) {
            roomConnections.delete(roomId);
        } else {
            // Broadcast updated user list
            broadcastRoomUsers(roomId);
        }
    }
    
    connections.delete(ws);
}

async function handlePositionUpdate(data) {
    const { email, roomId, x, y } = data;
    
    if (roomConnections.has(roomId)) {
        const roomUsers = roomConnections.get(roomId);
        const userData = roomUsers.get(email);
        if (userData) {
            userData.x = x;
            userData.y = y;
            broadcastRoomUsers(roomId);
        }
    }
}

function broadcastRoomUsers(roomId) {
    if (!roomConnections.has(roomId)) return;
    
    const roomUsers = roomConnections.get(roomId);
    const usersData = {};
    
    roomUsers.forEach((userData, email) => {
        usersData[email] = userData;
    });
    
    const message = JSON.stringify({
        type: 'room_users_update',
        users: usersData
    });
    
    // Send to all connections in the room
    connections.forEach((connectionData, ws) => {
        if (connectionData.roomId === roomId && ws.readyState === WebSocket.OPEN) {
            ws.send(message);
        }
    });
}

module.exports = { initializeWebSocketServer };