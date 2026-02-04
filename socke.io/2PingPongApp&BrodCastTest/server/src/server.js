import express from "express";
import http from "http";
import { Server } from "socket.io";
import pingPongHandler from "./socket/pingPongHandler.js";
import onlineUsersHandler from "./socket/onlineUsers.js";
import broadcastHandler from "./socket/broadcastHandler.js";

const FRONTEND_URL = "http://localhost:5173"; // frontend URL

const app = express();
const server = http.createServer(app);

// Socket.IO server with CORS
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

// Attach the online users handler
onlineUsersHandler(io);
pingPongHandler(io);
broadcastHandler(io);

server.listen(3000, () => console.log("Server running on port 3000"));
