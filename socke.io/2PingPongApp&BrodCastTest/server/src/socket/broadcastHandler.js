export default function broadcastHandler(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // 🔵 1️⃣ Jab koi client message bheje
    socket.on("send_message", (msg) => {
      console.log("Message from client:", msg);

      // 🔴 2️⃣ Server message ko SAB connected clients ko bhejega
      io.emit("receive_message", msg);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}
