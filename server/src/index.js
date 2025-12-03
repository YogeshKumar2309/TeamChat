// import express from "express";
// import http from "http";
// import cookieParser from "cookie-parser";
// import dotenv from "dotenv";
// import cors from "cors";
// import connectDB from "./config/db.js";
// import authRoutes from "./routers/auth.route.js";
// import channelRoutes from "./routers/channel.route.js";
// import { initSocket } from "./socket.js";
// import { Server } from "socket.io";

// dotenv.config();
// connectDB();

// const app = express();

// // Middleware
// app.use(express.json());
// app.use(cookieParser());

// const FRONTEND_URL =
//   process.env.NODE_ENV === "production"
//     ? process.env.FRONTEND_URL_PROD
//     : process.env.FRONTEND_URL;

// app.use(
//   cors({
//     origin: FRONTEND_URL,
//     credentials: true,
//   })
// );

// app.get("/", (req, res) => {
//   res.send("Server is running");
// });

// app.use("/api/auth", authRoutes);
// app.use("/api/channel", channelRoutes);

// // const io = new Server(app, {
// //   cors: {
// //     origin: FRONTEND_URL,
// //     methods: ["GET", "POST"],
// //     credentials: true,
// //   },
// // });


// // initSocket(io);

// // app.listen(process.env.PORT || 5000, () => {
// //   console.log(`Server running on port ${process.env.PORT || 5000}`);
// // });
// const server = http.createServer(app); // ← HTTP server from Express

// const io = new Server(server, {
//   cors: {
//     origin: FRONTEND_URL,
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });

// initSocket(io);

// server.listen(process.env.PORT || 5000, () => {
//   console.log(`Server running on port ${process.env.PORT || 5000}`);
// });


// server.js (Main Entry Point)
// ============================================
import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routers/auth.route.js";
import channelRoutes from "./routers/channel.route.js";
import messageRoutes from "./routers/message.route.js"; // Add this
import { initSocket } from "./socket.js";
import { Server } from "socket.io";

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

const FRONTEND_URL =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL_PROD
    : process.env.FRONTEND_URL;

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// Routes
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/channel", channelRoutes);
app.use("/api/messages", messageRoutes); // Add message routes

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // Better connection reliability
});

initSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});