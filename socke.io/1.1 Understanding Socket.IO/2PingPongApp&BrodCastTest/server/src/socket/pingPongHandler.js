export default function pingPongHandler(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // 🔵 Client → Server Ping
    socket.on("ping", () => {
      console.log("PING received from client");
      socket.emit("pong"); // 🔴 Server → Client Pong
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}
