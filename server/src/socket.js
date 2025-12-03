// // socket.js
// import { Server } from "socket.io";
// import jwt from "jsonwebtoken";

// // Online users और channel messages का storage
// export const onlineUsers = {};
// export const channelMessages = {};

// // JWT verify function
// export function verifyToken(token) {
//   try {
//     return jwt.verify(token, process.env.JWT_SECRET);
//   } catch (e) {
//     return null;
//   }
// }

// // Socket.io init function
// export function initSocket(io) {

//   io.on("connection", (socket) => {
//     console.log("User connected:", socket.id);

//     // User joins server after login
//     socket.on("join-server", (token) => {
//       const user = verifyToken(token);
//       if (!user) return socket.emit("auth-error", "Invalid token");

//       onlineUsers[user.id] = { username: user.username, socketId: socket.id };
//       io.emit("online-users", onlineUsers);
//     });

//     // User joins a channel
//     socket.on("join-channel", (channelName) => {
//       socket.join(channelName);
//       if (!channelMessages[channelName]) channelMessages[channelName] = [];
//       socket.emit("channel-messages", channelMessages[channelName]);
//     });

//     // User sends message
//     socket.on("send-message", ({ channelName, message, token }) => {
//       const user = verifyToken(token);
//       if (!user) return;

//       const msgObj = {
//         username: user.username,
//         message,
//         time: new Date().toISOString(),
//       };

//       if (!channelMessages[channelName]) channelMessages[channelName] = [];
//       channelMessages[channelName].push(msgObj);

//       io.to(channelName).emit("new-message", msgObj);
//     });

//     // User disconnects
//     socket.on("disconnect", () => {
//       for (const uid in onlineUsers) {
//         if (onlineUsers[uid].socketId === socket.id) delete onlineUsers[uid];
//       }
//       io.emit("online-users", onlineUsers);
//     });
//   });
// }


// ============================================
// socket.js (Socket.io Logic)
// ============================================
import jwt from "jsonwebtoken";
import { saveMessage, getMessagesByChannel } from "./controllers/message.controller.js";

// Online users storage
export const onlineUsers = {};

// JWT verify function
export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    console.error("Token verification failed:", e.message);
    return null;
  }
}

// Socket.io init function
export function initSocket(io) {
  // Middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }
    
    const user = verifyToken(token);
    if (!user) {
      return next(new Error("Invalid token"));
    }
    
    socket.user = user; // Attach user to socket
    next();
  });

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.username} (${socket.id})`);

    // User joins server after login
    socket.on("join-server", () => {
      onlineUsers[socket.user.id] = {
        username: socket.user.username,
        socketId: socket.id,
        id: socket.user.id
      };
      
      console.log(`👤 ${socket.user.username} joined server`);
      io.emit("online-users", onlineUsers);
    });

    // User joins a channel
    socket.on("join-channel", async (channelId) => {
      try {
        socket.join(channelId);
        // console.log(`📢 ${socket.user.username} joined channel: ${channelId}`);
        
        // Send existing messages to the user
        const messages = await getMessagesByChannel(channelId);
        socket.emit("channel-messages", {
          channelId,
          messages
        });
      } catch (err) {
        console.error("❌ Error joining channel:", err);
        socket.emit("error", { message: "Failed to join channel" });
      }
    });

    // User leaves a channel
    socket.on("leave-channel", (channelId) => {
      socket.leave(channelId);
      console.log(`🚪 ${socket.user.username} left channel: ${channelId}`);
    });

    // User sends message
    socket.on("send-message", async ({ channelId, channelName, message }) => {
      try {
        if (!message || !message.trim()) {
          return socket.emit("error", { message: "Message cannot be empty" });
        }

        if (!channelId) {
          return socket.emit("error", { message: "Channel ID is required" });
        }

        // Save message to database
        const msgObj = await saveMessage({
          channel: channelId,
          sender: socket.user.id,
          username: socket.user.username,
          message: message.trim(),
        });

        console.log(`💬 Message from ${socket.user.username} in ${channelName || channelId}`);

        // Broadcast to all users in the channel (including sender)
        io.to(channelId).emit("new-message", {
          _id: msgObj._id,
          channelId: channelId,
          username: msgObj.username,
          message: msgObj.message,
          createdAt: msgObj.createdAt,
          sender: msgObj.sender
        });
      } catch (err) {
        console.error("❌ Error sending message:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Get more messages (pagination)
    socket.on("get-more-messages", async ({ channelId, before, limit = 50 }) => {
      try {
        const messages = await getMessagesByChannel(channelId, {
          before,
          limit
        });
        
        socket.emit("more-messages", {
          channelId,
          messages
        });
      } catch (err) {
        console.error("❌ Error loading more messages:", err);
        socket.emit("error", { message: "Failed to load messages" });
      }
    });

    // Get channel messages (alternative way)
    socket.on("get-channel-messages", async ({ channelId }) => {
      try {
        const messages = await getMessagesByChannel(channelId);
        socket.emit("channel-messages", {
          channelId,
          messages
        });
      } catch (err) {
        console.error("❌ Error getting channel messages:", err);
        socket.emit("error", { message: "Failed to get messages" });
      }
    });

    // User disconnects
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.user.username} (${socket.id})`);
      
      // Remove from online users
      delete onlineUsers[socket.user.id];
      
      // Broadcast updated online users
      io.emit("online-users", onlineUsers);
    });

    // Error handling
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });
}
