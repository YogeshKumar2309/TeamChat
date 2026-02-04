# Show Active Members of Each Room - Complete Implementation

## 📁 Updated File Structure

```
chat-app/
├── backend/
│   ├── package.json
│   ├── server.js
│   └── socket/
│       └── roomHandler.js (UPDATED)
│
└── frontend/
    ├── package.json
    ├── .env
    └── src/
        ├── App.jsx
        ├── context/
        │   └── SocketContext.jsx
        └── components/
            ├── RoomSwitcher.jsx (UPDATED)
            └── ActiveMembers.jsx (NEW)
```

---

## 🔧 Backend Updates

### 1. **backend/socket/roomHandler.js** (UPDATED)

```javascript
export default function roomHandler(io) {
  // Track users and their rooms with usernames
  const userRooms = new Map(); // { socketId: roomName }
  const roomUsers = new Map(); // { roomName: Set of socketIds }
  const userProfiles = new Map(); // { socketId: { username, joinedAt, color } }

  // Generate random color for user
  const generateUserColor = () => {
    const colors = [
      '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', 
      '#F59E0B', '#EF4444', '#06B6D4', '#6366F1'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Generate username
  const generateUsername = (socketId) => {
    const adjectives = ['Happy', 'Cool', 'Swift', 'Brave', 'Smart', 'Quick'];
    const nouns = ['Tiger', 'Eagle', 'Dragon', 'Phoenix', 'Wolf', 'Lion'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 100);
    return `${adj}${noun}${num}`;
  };

  // Get active members of a room
  const getActiveMembers = (roomName) => {
    const memberIds = roomUsers.get(roomName);
    if (!memberIds) return [];

    return Array.from(memberIds).map(socketId => {
      const profile = userProfiles.get(socketId);
      return {
        socketId,
        username: profile?.username || 'Anonymous',
        color: profile?.color || '#6B7280',
        joinedAt: profile?.joinedAt || new Date().toISOString()
      };
    });
  };

  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Create user profile
    const username = generateUsername(socket.id);
    const color = generateUserColor();
    userProfiles.set(socket.id, {
      username,
      color,
      joinedAt: new Date().toISOString()
    });

    // Send user their profile
    socket.emit("userProfile", {
      socketId: socket.id,
      username,
      color
    });

    // Event 1: Join room
    socket.on("joinRoom", (roomName) => {
      console.log(`👤 ${socket.id} (${username}) wants to join room: ${roomName}`);

      // Leave previous room if exists
      const previousRoom = userRooms.get(socket.id);
      if (previousRoom) {
        socket.leave(previousRoom);
        
        const prevRoomUsers = roomUsers.get(previousRoom);
        if (prevRoomUsers) {
          prevRoomUsers.delete(socket.id);
          
          // Notify others in previous room
          socket.to(previousRoom).emit("userLeft", {
            userId: socket.id,
            username,
            roomName: previousRoom,
            message: `${username} left the room`
          });

          // Send updated members list to previous room
          const prevMembers = getActiveMembers(previousRoom);
          io.to(previousRoom).emit("activeMembers", {
            roomName: previousRoom,
            members: prevMembers,
            count: prevMembers.length
          });
        }
        
        console.log(`👋 ${username} left room: ${previousRoom}`);
      }

      // Join new room
      socket.join(roomName);
      userRooms.set(socket.id, roomName);

      // Track users in room
      if (!roomUsers.has(roomName)) {
        roomUsers.set(roomName, new Set());
      }
      roomUsers.get(roomName).add(socket.id);

      // Get active members
      const activeMembers = getActiveMembers(roomName);

      // Notify user about successful join
      socket.emit("roomJoined", {
        roomName,
        message: `You joined ${roomName}`,
        userId: socket.id,
        username
      });

      // Notify others in the room
      socket.to(roomName).emit("userJoined", {
        userId: socket.id,
        username,
        color,
        roomName,
        message: `${username} joined the room`
      });

      // Send active members to ALL users in room (including new user)
      io.to(roomName).emit("activeMembers", {
        roomName,
        members: activeMembers,
        count: activeMembers.length
      });

      console.log(`✅ ${username} joined room: ${roomName}`);
      console.log(`👥 Active members in ${roomName}:`, activeMembers.length);
    });

    // Event 2: Send message in room
    socket.on("sendRoomMessage", ({ roomName, message }) => {
      const userRoom = userRooms.get(socket.id);
      const profile = userProfiles.get(socket.id);

      if (userRoom !== roomName) {
        socket.emit("error", {
          message: "You are not in this room"
        });
        return;
      }

      // Broadcast message to all in room
      io.to(roomName).emit("roomMessage", {
        sender: socket.id,
        username: profile?.username || 'Anonymous',
        color: profile?.color || '#6B7280',
        message,
        roomName,
        timestamp: new Date().toISOString()
      });

      console.log(`💬 Message in ${roomName} from ${profile?.username}: ${message}`);
    });

    // Event 3: Request active members (optional, for manual refresh)
    socket.on("requestActiveMembers", (roomName) => {
      const members = getActiveMembers(roomName);
      socket.emit("activeMembers", {
        roomName,
        members,
        count: members.length
      });
    });

    // Event 4: Update username
    socket.on("updateUsername", (newUsername) => {
      const profile = userProfiles.get(socket.id);
      if (profile) {
        const oldUsername = profile.username;
        profile.username = newUsername;
        userProfiles.set(socket.id, profile);

        const currentRoom = userRooms.get(socket.id);
        if (currentRoom) {
          // Notify room about username change
          io.to(currentRoom).emit("usernameChanged", {
            socketId: socket.id,
            oldUsername,
            newUsername
          });

          // Send updated members list
          const members = getActiveMembers(currentRoom);
          io.to(currentRoom).emit("activeMembers", {
            roomName: currentRoom,
            members,
            count: members.length
          });
        }

        console.log(`✏️ ${oldUsername} changed name to ${newUsername}`);
      }
    });

    // Event 5: User disconnects
    socket.on("disconnect", () => {
      const profile = userProfiles.get(socket.id);
      const username = profile?.username || socket.id;
      
      console.log(`🔴 User disconnected: ${username}`);

      const userRoom = userRooms.get(socket.id);
      if (userRoom) {
        const roomUserSet = roomUsers.get(userRoom);
        if (roomUserSet) {
          roomUserSet.delete(socket.id);

          // Notify others
          socket.to(userRoom).emit("userLeft", {
            userId: socket.id,
            username,
            roomName: userRoom,
            message: `${username} disconnected`
          });

          // Send updated members list
          const members = getActiveMembers(userRoom);
          io.to(userRoom).emit("activeMembers", {
            roomName: userRoom,
            members,
            count: members.length
          });
        }

        userRooms.delete(socket.id);
      }

      // Clean up user profile
      userProfiles.delete(socket.id);
    });
  });
}
```

**Key Changes Explained:**

#### **New Data Structure - userProfiles**
```javascript
const userProfiles = new Map(); // { socketId: { username, joinedAt, color } }
```
- Har user ka profile store karta hai
- Username, color, aur join time track karta hai

#### **Generate Username Function**
```javascript
const generateUsername = (socketId) => {
  const adjectives = ['Happy', 'Cool', 'Swift', 'Brave'];
  const nouns = ['Tiger', 'Eagle', 'Dragon', 'Phoenix'];
  return `${adj}${noun}${num}`; // Example: "HappyTiger42"
};
```
- Random username generate karta hai
- User-friendly names: HappyTiger42, CoolDragon78, etc.

#### **Get Active Members Function**
```javascript
const getActiveMembers = (roomName) => {
  const memberIds = roomUsers.get(roomName);
  if (!memberIds) return [];

  return Array.from(memberIds).map(socketId => {
    const profile = userProfiles.get(socketId);
    return {
      socketId,
      username: profile?.username || 'Anonymous',
      color: profile?.color || '#6B7280',
      joinedAt: profile?.joinedAt
    };
  });
};
```
- Room ke sabhi active members ki list return karta hai
- Har member ka username, color aur join time include karta hai

#### **Broadcasting Active Members**
```javascript
io.to(roomName).emit("activeMembers", {
  roomName,
  members: activeMembers,
  count: activeMembers.length
});
```
- Jab bhi koi join/leave kare, updated list bhejta hai
- Sabhi room members ko notify karta hai

---

## 💻 Frontend Updates

### 2. **frontend/src/components/ActiveMembers.jsx** (NEW)

```javascript
import React from 'react';

const ActiveMembers = ({ members, currentUserId }) => {
  if (!members || members.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <div className="text-4xl mb-2">👻</div>
        <p>No active members</p>
      </div>
    );
  }

  // Sort: Current user first, then by join time
  const sortedMembers = [...members].sort((a, b) => {
    if (a.socketId === currentUserId) return -1;
    if (b.socketId === currentUserId) return 1;
    return new Date(a.joinedAt) - new Date(b.joinedAt);
  });

  // Calculate time since joined
  const getTimeSinceJoined = (joinedAt) => {
    const now = new Date();
    const joined = new Date(joinedAt);
    const diffMs = now - joined;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-2 mb-3">
        Active Members ({members.length})
      </h3>
      
      <div className="space-y-1">
        {sortedMembers.map((member) => {
          const isCurrentUser = member.socketId === currentUserId;
          
          return (
            <div
              key={member.socketId}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                isCurrentUser 
                  ? 'bg-indigo-50 border-2 border-indigo-200' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {/* Avatar with color */}
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                style={{ backgroundColor: member.color }}
              >
                {member.username.substring(0, 2).toUpperCase()}
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800 truncate">
                    {member.username}
                  </p>
                  {isCurrentUser && (
                    <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {getTimeSinceJoined(member.joinedAt)}
                </p>
              </div>

              {/* Online indicator */}
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActiveMembers;
```

**Component Explanation:**

#### **Props**
```javascript
const ActiveMembers = ({ members, currentUserId }) => {
```
- `members`: Active members ki array
- `currentUserId`: Current user ka socket ID (to highlight)

#### **Sorting Logic**
```javascript
const sortedMembers = [...members].sort((a, b) => {
  if (a.socketId === currentUserId) return -1; // Current user first
  if (b.socketId === currentUserId) return 1;
  return new Date(a.joinedAt) - new Date(b.joinedAt); // Then by join time
});
```
- Current user hamesha top par
- Baaki users join time se sorted

#### **Time Calculation**
```javascript
const getTimeSinceJoined = (joinedAt) => {
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  // ... hours, days
};
```
- "Just now", "5m ago", "2h ago" format mein time show karta hai

#### **UI Elements**
- **Avatar**: User ke color ke saath circular badge
- **Username**: Bold text with "You" badge for current user
- **Join time**: "5m ago" format
- **Online indicator**: Green pulsing dot

---

### 3. **frontend/src/components/RoomSwitcher.jsx** (UPDATED)

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import ActiveMembers from './ActiveMembers';

const RoomSwitcher = () => {
  const { socket, isConnected } = useSocket();
  
  // State management
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [activeMembers, setActiveMembers] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [customRoomName, setCustomRoomName] = useState("");
  const [showMembersPanel, setShowMembersPanel] = useState(true);
  
  // Ref for auto-scroll
  const messagesEndRef = useRef(null);

  // Predefined rooms
  const predefinedRooms = ["General", "Tech", "Gaming", "Music", "Random"];

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // User profile received
    const handleUserProfile = (data) => {
      console.log("👤 User profile:", data);
      setUserProfile(data);
    };

    // Room joined successfully
    const handleRoomJoined = (data) => {
      console.log("✅ Joined room:", data);
      setCurrentRoom(data.roomName);
      setMessages([{
        type: "system",
        message: data.message,
        timestamp: new Date().toISOString()
      }]);
    };

    // Another user joined
    const handleUserJoined = (data) => {
      console.log("👤 User joined:", data);
      setMessages(prev => [...prev, {
        type: "system",
        message: data.message,
        timestamp: new Date().toISOString()
      }]);
    };

    // User left the room
    const handleUserLeft = (data) => {
      console.log("👋 User left:", data);
      setMessages(prev => [...prev, {
        type: "system",
        message: data.message,
        timestamp: new Date().toISOString()
      }]);
    };

    // Receive message
    const handleRoomMessage = (data) => {
      console.log("💬 New message:", data);
      setMessages(prev => [...prev, {
        type: "message",
        sender: data.sender,
        username: data.username,
        color: data.color,
        message: data.message,
        timestamp: data.timestamp,
        isOwn: data.sender === socket.id
      }]);
    };

    // Active members update
    const handleActiveMembers = (data) => {
      console.log("👥 Active members updated:", data);
      setActiveMembers(data.members);
    };

    // Username changed
    const handleUsernameChanged = (data) => {
      console.log("✏️ Username changed:", data);
      setMessages(prev => [...prev, {
        type: "system",
        message: `${data.oldUsername} changed name to ${data.newUsername}`,
        timestamp: new Date().toISOString()
      }]);
    };

    // Error handling
    const handleError = (data) => {
      console.error("❌ Error:", data);
      alert(data.message);
    };

    // Attach listeners
    socket.on("userProfile", handleUserProfile);
    socket.on("roomJoined", handleRoomJoined);
    socket.on("userJoined", handleUserJoined);
    socket.on("userLeft", handleUserLeft);
    socket.on("roomMessage", handleRoomMessage);
    socket.on("activeMembers", handleActiveMembers);
    socket.on("usernameChanged", handleUsernameChanged);
    socket.on("error", handleError);

    // Cleanup listeners
    return () => {
      socket.off("userProfile", handleUserProfile);
      socket.off("roomJoined", handleRoomJoined);
      socket.off("userJoined", handleUserJoined);
      socket.off("userLeft", handleUserLeft);
      socket.off("roomMessage", handleRoomMessage);
      socket.off("activeMembers", handleActiveMembers);
      socket.off("usernameChanged", handleUsernameChanged);
      socket.off("error", handleError);
    };
  }, [socket]);

  // Join room function
  const joinRoom = (roomName) => {
    if (!socket || !roomName.trim()) return;
    
    console.log("🚪 Joining room:", roomName);
    socket.emit("joinRoom", roomName.trim());
    setCustomRoomName("");
  };

  // Send message function
  const sendMessage = () => {
    if (!socket || !currentRoom || !inputMessage.trim()) return;

    console.log("📤 Sending message:", inputMessage);
    socket.emit("sendRoomMessage", {
      roomName: currentRoom,
      message: inputMessage.trim()
    });

    setInputMessage("");
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                🚀 Real-Time Chat Rooms
              </h1>
              <p className="text-gray-600 mt-1">
                {userProfile ? `Welcome, ${userProfile.username}!` : 'Loading...'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <div className={`inline-flex items-center px-4 py-2 rounded-full ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
              
              {/* Toggle Members Panel */}
              <button
                onClick={() => setShowMembersPanel(!showMembersPanel)}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full font-medium hover:bg-indigo-200 transition-colors"
              >
                {showMembersPanel ? '👥 Hide Members' : '👥 Show Members'}
              </button>
            </div>
          </div>
        </div>

        {/* Room Selection */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📍 Select Room
          </h2>
          
          {/* Predefined Rooms */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            {predefinedRooms.map((room) => (
              <button
                key={room}
                onClick={() => joinRoom(room)}
                disabled={!isConnected}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  currentRoom === room
                    ? 'bg-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {room}
                {currentRoom === room && ' ✓'}
              </button>
            ))}
          </div>

          {/* Custom Room Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customRoomName}
              onChange={(e) => setCustomRoomName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && joinRoom(customRoomName)}
              placeholder="Enter custom room name..."
              disabled={!isConnected}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
            <button
              onClick={() => joinRoom(customRoomName)}
              disabled={!isConnected || !customRoomName.trim()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chat Area */}
          <div className={`${showMembersPanel ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            {/* Current Room Info */}
            {currentRoom && (
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 mb-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">
                      📢 {currentRoom}
                    </h3>
                    <p className="text-indigo-100 mt-1">You are currently in this room</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{activeMembers.length}</div>
                    <div className="text-indigo-100">
                      {activeMembers.length === 1 ? 'Member' : 'Members'} Online
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="h-96 overflow-y-auto p-6 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <div className="text-6xl mb-4">💬</div>
                      <p className="text-lg">No messages yet</p>
                      <p className="text-sm">Be the first to say something!</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg, index) => (
                      <div key={index}>
                        {msg.type === "system" ? (
                          <div className="flex justify-center">
                            <div className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm">
                              {msg.message}
                            </div>
                          </div>
                        ) : (
                          <div className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md ${
                              msg.isOwn 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-white border-2'
                            } rounded-2xl px-4 py-3 shadow-sm`}
                            style={!msg.isOwn ? { borderColor: msg.color } : {}}
                            >
                              {!msg.isOwn && (
                                <div className="flex items-center gap-2 mb-1">
                                  <div 
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                    style={{ backgroundColor: msg.color }}
                                  >
                                    {msg.username.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="text-xs font-semibold" style={{ color: msg.color }}>
                                    {msg.username}
                                  </div>
                                </div>
                              )}
                              <div className={`break-words ${msg.isOwn ? 'text-white' : 'text-gray-800'}`}>
                                {msg.message}
                              </div>
                              <div className={`text-xs mt-1 ${
                                msg.isOwn ? 'text-indigo-200' : 'text-gray-400'
                              }`}>
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4 bg-white">
                {currentRoom ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      disabled={!isConnected}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!isConnected || !inputMessage.trim()}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-3">
                    Please join a room to start chatting
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Members Panel */}
          {showMembersPanel && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
                <ActiveMembers 
                  members={activeMembers} 
                  currentUserId={userProfile?.socketId}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomSwitcher;
```

**Key Updates Explained:**

#### **New State Variables**
```javascript
const [activeMembers, setActiveMembers] = useState([]);
const [userProfile, setUserProfile] = useState(null);
const [showMembersPanel, setShowMembersPanel] = useState(true);
```
- `activeMembers`: Current room ke active members
- `userProfile`: Current user ki profile (username, color)
- `showMembersPanel`: Members panel show/hide toggle

#### **Active Members EventListener**
```javascript
const handleActiveMembers = (data) => {
  console.log("👥 Active members updated:", data);
  setActiveMembers(data.members);
};

socket.on("activeMembers", handleActiveMembers);
```
- Backend se active members list receive karta hai
- State update karta hai

#### **Enhanced Message Display**
```javascript
<div 
  className="w-6 h-6 rounded-full"
  style={{ backgroundColor: msg.color }}
>
  {msg.username.substring(0, 2).toUpperCase()}
</div>
<div className="text-xs font-semibold" style={{ color: msg.color }}>
  {msg.username}
</div>
```
- Har message ke saath user ka avatar aur username show hota hai
- User ka unique color use hota hai

#### **Grid Layout with Members Panel**
```javascript
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <div className={`${showMembersPanel ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
    {/* Chat Area */}
  </div>
  
  {showMembersPanel && (
    <div className="lg:col-span-1">
      <ActiveMembers />
    </div>
  )}
</div>
```
- Responsive grid layout
- Members panel toggle kar sakte ho

---

## 🎯 Complete Data Flow

### **When User Joins Room:**

```
1. User clicks "Join Tech"
         ↓
2. Frontend: socket.emit("joinRoom", "Tech")
         ↓
3. Backend receives event
         ↓
4. Backend creates user profile (if new)
         ↓
5. Backend adds user to room
         ↓
6. Backend calls getActiveMembers("Tech")
         ↓
7. Backend emits multiple events:
   - "userProfile" → User
   - "roomJoined" → User
   - "userJoined" → Others in Tech
   - "activeMembers" → Everyone in Tech
         ↓
8. Frontend receives events
         ↓
9. Frontend updates:
   - userProfile state
   - currentRoom state
   - activeMembers state
   - messages array
         ↓
10. UI re-renders:
    - Room badge updates
    - Member count updates
    - Active members list updates
    - System message appears
```

---

## 📊 Data Structure Examples

### **Backend - Active Members:**
```javascript
{
  roomName: "Tech",
  members: [
    {
      socketId: "abc123",
      username: "HappyTiger42",
      color: "#3B82F6",
      joinedAt: "2024-01-01T12:00:00Z"
    },
    {
      socketId: "xyz789",
      username: "BraveDragon88",
      color: "#EC4899",
      joinedAt: "2024-01-01T12:05:00Z"
    }
  ],
  count: 2
}
```

### **Frontend - Message with User Info:**
```javascript
{
  type: "message",
  sender: "abc123",
  username: "HappyTiger42",
  color: "#3B82F6",
  message: "Hello everyone!",
  timestamp: "2024-01-01T12:10:00Z",
  isOwn: false
}
```

---

## ✨ New Features Added

1. **Auto-generated Usernames** - HappyTiger42, CoolDragon88 style
2. **User Colors** - Har user ka unique color
3. **Active Members List** - Real-time update hoti hai
4. **Member Join Time** - "5m ago" format
5. **Current User Highlight** - "You" badge
6. **Toggle Members Panel** - Show/hide kar sakte ho
7. **Enhanced Messages** - Avatar aur username ke saath
8. **Online Indicators** - Green pulsing dot
9. **Username Display** - Har message mein
10. **Responsive Layout** - Mobile-friendly

---

## 🚀 Testing Guide

### **Test Case 1: Single User**
1. Open browser → `http://localhost:5173`
2. Join "General" room
3. Check: You should see yourself in Active Members
4. Check: Member count should be 1

### **Test Case 2: Multiple Users**
1. Open two browser windows (or use incognito)
2. Both join "Tech" room
3. Check: Both users visible in Active Members
4. Check: Member count = 2
5. Check: Different colors for each user

### **Test Case 3: Room Switching**
1. User 1 joins "General"
2. User 2 joins "General"
3. User 1 switches to "Tech"
4. Check: User 1 removed from General's member list
5. Check: User 1 shown in Tech's member list
6. Check: Counts updated correctly

### **Test Case 4: Disconnect**
1. User joins room
2. Close browser tab
3. Check: User removed from member list
4. Check: System message "X disconnected"

---

## 🎨 Customization Options

### **Change Color Palette:**
```javascript
// backend/socket/roomHandler.js
const generateUserColor = () => {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Cyan
    '#45B7D1', // Blue
    '#FFA07A', // Orange
    '#98D8C8', // Mint
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};
```

### **Change Username Style:**
```javascript
const generateUsername = (socketId) => {
  const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta'];
  const suffixes = ['User', 'Pro', 'Master', 'Elite'];
  // Creates: AlphaUser123, BetaPro456, etc.
  return `${prefix}${suffix}${num}`;
};
```

---

Yeh complete implementation hai Active Members feature ka! Ab tumhare chat app mein real-time member tracking hai with usernames, colors, aur join times. 🎉