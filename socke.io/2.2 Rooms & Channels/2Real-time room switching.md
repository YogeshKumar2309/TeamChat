
# Real-Time Room Switching - Complete Implementation

## 📁 Project File Structure

```
chat-app/
├── backend/
│   ├── package.json
│   ├── server.js
│   └── socket/
│       └── roomHandler.js
│
└── frontend/
    ├── package.json
    ├── .env
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── context/
        │   └── SocketContext.jsx
        └── components/
            └── RoomSwitcher.jsx
```

---

## 🔧 Backend Implementation

### 1. **backend/package.json**
```json
{
  "name": "chat-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

**Explanation:**
- `"type": "module"` - ES6 imports use karne ke liye
- `express` - Web server
- `socket.io` - Real-time communication
- `nodemon` - Auto-restart on file changes (development ke liye)

---

### 2. **backend/server.js**
```javascript
import express from "express";
import http from "http";
import { Server } from "socket.io";
import roomHandler from "./socket/roomHandler.js";

// Configuration
const PORT = 3000;
const FRONTEND_URL = "http://localhost:5173";

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Middleware for express (optional, for future API endpoints)
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

// Attach socket handlers
roomHandler(io);

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Frontend allowed from ${FRONTEND_URL}`);
});
```

**Line by Line Explanation:**

```javascript
import express from "express";
import http from "http";
import { Server } from "socket.io";
```
- **express**: HTTP server banane ke liye
- **http**: Native Node.js HTTP module
- **Server**: Socket.IO ka server class

```javascript
const app = express();
const server = http.createServer(app);
```
- Express app create kiya
- HTTP server banaya jo Express ko wrap karta hai (Socket.IO ko HTTP server chahiye)

```javascript
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  },
});
```
- Socket.IO server initialize kiya
- **CORS**: Cross-Origin requests allow karne ke liye
- **origin**: Sirf is URL se requests accept karenge
- **credentials**: Cookies/auth headers allow karta hai

```javascript
roomHandler(io);
```
- Socket event handlers ko attach kar diya

```javascript
server.listen(PORT, () => { ... });
```
- Server ko port 3000 par start kiya

---

### 3. **backend/socket/roomHandler.js**
```javascript
export default function roomHandler(io) {
  // Track users and their rooms
  const userRooms = new Map(); // { socketId: roomName }
  const roomUsers = new Map(); // { roomName: Set of socketIds }

  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Event 1: User joins a room
    socket.on("joinRoom", (roomName) => {
      console.log(`👤 ${socket.id} wants to join room: ${roomName}`);

      // Leave previous room if exists
      const previousRoom = userRooms.get(socket.id);
      if (previousRoom) {
        socket.leave(previousRoom);
        
        // Remove user from previous room tracking
        const prevRoomUsers = roomUsers.get(previousRoom);
        if (prevRoomUsers) {
          prevRoomUsers.delete(socket.id);
          
          // Notify others in previous room
          socket.to(previousRoom).emit("userLeft", {
            userId: socket.id,
            roomName: previousRoom,
            message: `User ${socket.id} left the room`
          });

          // Send updated user count
          io.to(previousRoom).emit("roomUserCount", {
            roomName: previousRoom,
            count: prevRoomUsers.size
          });
        }
        
        console.log(`👋 ${socket.id} left room: ${previousRoom}`);
      }

      // Join new room
      socket.join(roomName);
      userRooms.set(socket.id, roomName);

      // Track users in room
      if (!roomUsers.has(roomName)) {
        roomUsers.set(roomName, new Set());
      }
      roomUsers.get(roomName).add(socket.id);

      // Notify user about successful join
      socket.emit("roomJoined", {
        roomName,
        message: `You joined ${roomName}`,
        userId: socket.id
      });

      // Notify others in the room
      socket.to(roomName).emit("userJoined", {
        userId: socket.id,
        roomName,
        message: `User ${socket.id} joined the room`
      });

      // Send updated user count to all in room
      const currentRoomUsers = roomUsers.get(roomName);
      io.to(roomName).emit("roomUserCount", {
        roomName,
        count: currentRoomUsers.size
      });

      console.log(`✅ ${socket.id} joined room: ${roomName}`);
    });

    // Event 2: Send message in room
    socket.on("sendRoomMessage", ({ roomName, message }) => {
      const userRoom = userRooms.get(socket.id);

      // Verify user is in the room
      if (userRoom !== roomName) {
        socket.emit("error", {
          message: "You are not in this room"
        });
        return;
      }

      // Broadcast message to all in room (including sender)
      io.to(roomName).emit("roomMessage", {
        sender: socket.id,
        message,
        roomName,
        timestamp: new Date().toISOString()
      });

      console.log(`💬 Message in ${roomName} from ${socket.id}: ${message}`);
    });

    // Event 3: Get current room info
    socket.on("getCurrentRoom", () => {
      const currentRoom = userRooms.get(socket.id);
      const roomUserCount = currentRoom 
        ? roomUsers.get(currentRoom)?.size || 0 
        : 0;

      socket.emit("currentRoomInfo", {
        roomName: currentRoom || null,
        userCount: roomUserCount
      });
    });

    // Event 4: User disconnects
    socket.on("disconnect", () => {
      console.log(`🔴 User disconnected: ${socket.id}`);

      const userRoom = userRooms.get(socket.id);
      if (userRoom) {
        // Remove from room tracking
        const roomUserSet = roomUsers.get(userRoom);
        if (roomUserSet) {
          roomUserSet.delete(socket.id);

          // Notify others
          socket.to(userRoom).emit("userLeft", {
            userId: socket.id,
            roomName: userRoom,
            message: `User ${socket.id} disconnected`
          });

          // Update user count
          io.to(userRoom).emit("roomUserCount", {
            roomName: userRoom,
            count: roomUserSet.size
          });
        }

        // Clean up
        userRooms.delete(socket.id);
      }
    });
  });
}
```

**Detailed Explanation:**

#### **Data Structures**
```javascript
const userRooms = new Map(); // { socketId: roomName }
const roomUsers = new Map(); // { roomName: Set of socketIds }
```
- `userRooms`: Har user kis room mein hai, ye track karta hai
- `roomUsers`: Har room mein kitne users hain, ye track karta hai

#### **Connection Event**
```javascript
io.on("connection", (socket) => {
```
- Jab bhi koi user connect hota hai, ye function run hota hai

#### **Join Room Logic**
```javascript
const previousRoom = userRooms.get(socket.id);
if (previousRoom) {
  socket.leave(previousRoom);
  // ... notify others
}
```
**Flow:**
1. Check karo ki user pehle se kisi room mein hai
2. Agar hai, toh us room se leave karo
3. Purane room ke users ko notify karo
4. User count update karo

```javascript
socket.join(roomName);
userRooms.set(socket.id, roomName);
roomUsers.get(roomName).add(socket.id);
```
**Flow:**
1. User ko naye room mein add karo
2. Tracking maps update karo
3. Naye room ke users ko notify karo

#### **Send Message Logic**
```javascript
if (userRoom !== roomName) {
  socket.emit("error", { message: "You are not in this room" });
  return;
}
```
- Verify karo ki user sahi room mein hai
- Security check hai ye

```javascript
io.to(roomName).emit("roomMessage", { ... });
```
- Us room ke SABHI users ko message bhejo (including sender)

#### **Disconnect Logic**
```javascript
socket.on("disconnect", () => {
  // Remove from tracking
  // Notify others
  // Update counts
});
```
- User disconnect ho gaya toh cleanup karo
- Other users ko notify karo

---

## 💻 Frontend Implementation

### 4. **frontend/.env**
```env
VITE_API_URL=http://localhost:3000
```

**Explanation:**
- Vite environment variable (must start with `VITE_`)
- Backend server ka URL

---

### 5. **frontend/package.json**
```json
{
  "name": "chat-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.6.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24",
    "tailwindcss": "^3.3.2",
    "vite": "^4.3.9"
  }
}
```

---

### 6. **frontend/src/main.jsx**
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**Explanation:**
- React app ka entry point
- `index.html` mein `<div id="root">` ko target karta hai

---

### 7. **frontend/src/index.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}
```

---

### 8. **frontend/src/context/SocketContext.jsx**
```javascript
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

// Create context
const SocketContext = createContext(null);

// Custom hook to use socket
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

// Socket Provider Component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const SOCKET_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // Validate URL
    if (!SOCKET_URL) {
      console.error("❌ SOCKET_URL is not defined in .env file");
      return;
    }

    console.log("🔄 Attempting to connect to:", SOCKET_URL);

    // Create socket connection
    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Connection successful
    socketInstance.on("connect", () => {
      console.log("✅ Socket connected successfully:", socketInstance.id);
      setIsConnected(true);
    });

    // Connection error
    socketInstance.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      setIsConnected(false);
    });

    // Disconnection
    socketInstance.on("disconnect", (reason) => {
      console.log("🔴 Socket disconnected:", reason);
      setIsConnected(false);
    });

    // Reconnection attempt
    socketInstance.on("reconnect_attempt", (attempt) => {
      console.log(`🔄 Reconnection attempt ${attempt}...`);
    });

    // Reconnection successful
    socketInstance.on("reconnect", (attempt) => {
      console.log(`✅ Reconnected successfully after ${attempt} attempts`);
      setIsConnected(true);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      console.log("🧹 Cleaning up socket connection");
      socketInstance.disconnect();
    };
  }, [SOCKET_URL]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
```

**Line by Line Explanation:**

```javascript
const SocketContext = createContext(null);
```
- React Context banaya socket ko share karne ke liye

```javascript
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};
```
- Custom hook jo socket provide karta hai
- Error throw karta hai agar SocketProvider ke bahar use kiya

```javascript
const socketInstance = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});
```
- Socket.IO client instance banaya
- **transports**: WebSocket pehle try karega, fail hone par polling
- **reconnection**: Auto-reconnect enable
- **reconnectionDelay**: 1 second wait karke retry
- **reconnectionAttempts**: Maximum 5 bar try karega

```javascript
socketInstance.on("connect", () => {
  setIsConnected(true);
});
```
- Connection successful hone par `isConnected` true set karta hai

```javascript
return () => {
  socketInstance.disconnect();
};
```
- Component unmount hone par socket disconnect karta hai

---

### 9. **frontend/src/components/RoomSwitcher.jsx**
```javascript
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

const RoomSwitcher = () => {
  const { socket, isConnected } = useSocket();
  
  // State management
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [userCount, setUserCount] = useState(0);
  const [customRoomName, setCustomRoomName] = useState("");
  
  // Ref for auto-scroll
  const messagesEndRef = useRef(null);

  // Predefined rooms
  const predefinedRooms = ["General", "Tech", "Gaming", "Music"];

  // Auto-scroll to bottom when new message arrives
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

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
        message: data.message,
        timestamp: data.timestamp,
        isOwn: data.sender === socket.id
      }]);
    };

    // Room user count update
    const handleRoomUserCount = (data) => {
      console.log("👥 User count updated:", data);
      setUserCount(data.count);
    };

    // Error handling
    const handleError = (data) => {
      console.error("❌ Error:", data);
      alert(data.message);
    };

    // Attach listeners
    socket.on("roomJoined", handleRoomJoined);
    socket.on("userJoined", handleUserJoined);
    socket.on("userLeft", handleUserLeft);
    socket.on("roomMessage", handleRoomMessage);
    socket.on("roomUserCount", handleRoomUserCount);
    socket.on("error", handleError);

    // Cleanup listeners
    return () => {
      socket.off("roomJoined", handleRoomJoined);
      socket.off("userJoined", handleUserJoined);
      socket.off("userLeft", handleUserLeft);
      socket.off("roomMessage", handleRoomMessage);
      socket.off("roomUserCount", handleRoomUserCount);
      socket.off("error", handleError);
    };
  }, [socket]);

  // Join room function
  const joinRoom = (roomName) => {
    if (!socket || !roomName.trim()) return;
    
    console.log("🚪 Joining room:", roomName);
    socket.emit("joinRoom", roomName.trim());
    setCustomRoomName(""); // Clear custom input
  };

  // Send message function
  const sendMessage = () => {
    if (!socket || !currentRoom || !inputMessage.trim()) return;

    console.log("📤 Sending message:", inputMessage);
    socket.emit("sendRoomMessage", {
      roomName: currentRoom,
      message: inputMessage.trim()
    });

    setInputMessage(""); // Clear input
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                🚀 Real-Time Room Switcher
              </h1>
              <p className="text-gray-600 mt-1">
                Switch between rooms instantly!
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-4 py-2 rounded-full ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
        </div>

        {/* Room Selection */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📍 Select Room
          </h2>
          
          {/* Predefined Rooms */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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
                <div className="text-3xl font-bold">{userCount}</div>
                <div className="text-indigo-100">
                  {userCount === 1 ? 'User' : 'Users'} Online
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Messages Container */}
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
                      // System message
                      <div className="flex justify-center">
                        <div className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm">
                          {msg.message}
                        </div>
                      </div>
                    ) : (
                      // User message
                      <div className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md ${
                          msg.isOwn 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-white text-gray-800 border border-gray-200'
                        } rounded-2xl px-4 py-3 shadow-sm`}>
                          {!msg.isOwn && (
                            <div className="text-xs font-semibold mb-1 text-gray-500">
                              User {msg.sender.substring(0, 6)}
                            </div>
                          )}
                          <div className="break-words">{msg.message}</div>
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
    </div>
  );
};

export default RoomSwitcher;
```

**Key Features Explanation:**

#### **State Management**
```javascript
const [currentRoom, setCurrentRoom] = useState(null);
const [messages, setMessages] = useState([]);
const [inputMessage, setInputMessage] = useState("");
const [userCount, setUserCount] = useState(0);
```
- `currentRoom`: User abhi kis room mein hai
- `messages`: Saare messages ka array
- `inputMessage`: User jo type kar raha hai
- `userCount`: Current room mein kitne users hain

#### **Auto-Scroll Feature**
```javascript
const messagesEndRef = useRef(null);

const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
};

useEffect(() => {
  scrollToBottom();
}, [messages]);
```
- Jab bhi naya message aaye, automatically scroll down ho jaye

#### **Socket Event Listeners**
```javascript
useEffect(() => {
  if (!socket) return;

  socket.on("roomJoined", handleRoomJoined);
  // ... more listeners

  return () => {
    socket.off("roomJoined", handleRoomJoined);
    // ... cleanup
  };
}, [socket]);
```
- Backend se events listen karta hai
- **Cleanup zaruri hai** duplicate listeners se bachne ke liye

#### **Join Room Function**
```javascript
const joinRoom = (roomName) => {
  if (!socket || !roomName.trim()) return;
  socket.emit("joinRoom", roomName.trim());
  setCustomRoomName("");
};
```
- Backend ko "joinRoom" event emit karta hai
- Room name trim karke bhejta hai (extra spaces remove)

#### **Send Message Function**
```javascript
const sendMessage = () => {
  if (!socket || !currentRoom || !inputMessage.trim()) return;
  
  socket.emit("sendRoomMessage", {
    roomName: currentRoom,
    message: inputMessage.trim()
  });
  
  setInputMessage("");
};
```
- Current room aur message backend ko bhejta hai
- Input field clear kar deta hai

---

### 10. **frontend/src/App.jsx**
```javascript
import React from 'react';
import { SocketProvider } from './context/SocketContext';
import RoomSwitcher from './components/RoomSwitcher';

function App() {
  return (<SocketProvider>
      <RoomSwitcher />
    </SocketProvider>
  );
}

export default App;
```

**Explanation:**
- `SocketProvider` pure app ko wrap karta hai
- `RoomSwitcher` component render karta hai
- Ab koi bhi component `useSocket()` hook use kar sakta hai

---

## 🚀 How to Run the Project

### **Step 1: Backend Setup**

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Start server
npm start
# OR for development with auto-restart
npm run dev
```

**You should see:**
```
✅ Server running on http://localhost:3000
✅ Frontend allowed from http://localhost:5173
```

---

### **Step 2: Frontend Setup**

```bash
# Open new terminal
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Install Tailwind CSS (if not included)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Start development server
npm run dev
```

**You should see:**
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

### **Step 3: Configure Tailwind (if needed)**

**frontend/tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

---

## 🎯 How Real-Time Room Switching Works

### **Flow Diagram:**

```
User clicks "Join Tech"
         ↓
Frontend: joinRoom("Tech")
         ↓
Emit "joinRoom" event → Backend
         ↓
Backend checks: User in previous room?
         ↓
    Yes: Leave previous room
         Notify old room users
         ↓
Backend: socket.join("Tech")
         ↓
Backend emits:
  - "roomJoined" → User
  - "userJoined" → Others in Tech
  - "roomUserCount" → Everyone in Tech
         ↓
Frontend receives events
         ↓
UI updates:
  - Current room badge
  - User count
  - System message
         ↓
User can now send messages in Tech room
```

---

## 🔄 Complete Communication Flow

### **Scenario: User switches from "General" to "Tech"**

1. **User Action:**
   ```javascript
   onClick={() => joinRoom("Tech")}
   ```

2. **Frontend emits:**
   ```javascript
   socket.emit("joinRoom", "Tech")
   ```

3. **Backend receives:**
   ```javascript
   socket.on("joinRoom", (roomName) => {
     // Leave "General"
     // Join "Tech"
     // Notify users
   })
   ```

4. **Backend emits to "General" room:**
   ```javascript
   socket.to("General").emit("userLeft", {...})
   ```

5. **Backend emits to "Tech" room:**
   ```javascript
   socket.to("Tech").emit("userJoined", {...})
   io.to("Tech").emit("roomUserCount", {...})
   ```

6. **Frontend receives and updates UI:**
   ```javascript
   socket.on("roomJoined", (data) => {
     setCurrentRoom("Tech")
     setMessages([...])
   })
   ```

---

## ✨ Key Features

1. **Instant Room Switching** - No page reload
2. **Real-time User Count** - Live updates
3. **Message History per Room** - Clears when switching
4. **System Notifications** - Join/leave alerts
5. **Custom Rooms** - Create any room name
6. **Auto-scroll** - New messages auto-scroll
7. **Connection Status** - Visual indicator
8. **Responsive Design** - Works on all devices

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Error
**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
```javascript
// backend/server.js
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Match frontend URL exactly
    methods: ["GET", "POST"],
    credentials: true
  },
});
```

### Issue 2: Messages Duplicating
**Cause:** Multiple event listeners attached

**Solution:**
```javascript
// Always cleanup listeners
useEffect(() => {
  socket.on("roomMessage", handleMessage);
  
  return () => {
    socket.off("roomMessage", handleMessage); // IMPORTANT
  };
}, [socket]);
```

### Issue 3: Socket Not Connecting
**Check:**
1. Backend server running? `http://localhost:3000`
2. `.env` file exists with `VITE_API_URL=http://localhost:3000`?
3. Restart Vite after `.env` changes

---

## 📊 Data Structures Used

### Backend:
```javascript
userRooms = Map {
  "socket123" => "General",
  "socket456" => "Tech"
}

roomUsers = Map {
  "General" => Set { "socket123", "socket789" },
  "Tech" => Set { "socket456" }
}
```

### Frontend:
```javascript
messages = [
  {
    type: "system",
    message: "You joined General",
    timestamp: "2024-01-01T12:00:00Z"
  },
  {
    type: "message",
    sender: "socket123",
    message: "Hello everyone!",
    timestamp: "2024-01-01T12:01:00Z",
    isOwn: true
  }
]
```

---

Yeh complete implementation hai real-time room switching ka! Ab tum step-by-step follow karke working project bana sakte ho. 🎉