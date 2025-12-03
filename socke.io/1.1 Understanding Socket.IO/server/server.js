import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();

// Create HTTP server (Socket.IO needs this)
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*", // later change this to your frontend URL
  },
});

// When a new client connects
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // When a user disconnects
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start server
server.listen(3001, () => {
  console.log("Server running on port 3001");
});
