export default function onlineUsersHandler(io) {
  let onlineUsers = 0;

  io.on("connection", (socket) => {
    onlineUsers++;                        // new user connect hua
    console.log("User Connected:", socket.id);

    // Send current online count to all clients
    io.emit("onlineUsers", onlineUsers);
    console.log("Online Users:", onlineUsers);

    // Disconnect hone par
    socket.on("disconnect", () => {
      onlineUsers--;                      // user gaya
      console.log("User Disconnected:", socket.id);
      io.emit("onlineUsers", onlineUsers); // update sabko bhej do
    });
  });
}
