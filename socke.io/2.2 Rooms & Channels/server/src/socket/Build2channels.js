export default function buildChannelsHandler(io) {
  io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join channel
  socket.on("joinChannel", (channelName) => {
    socket.join(channelName);
    socket.to(channelName).emit("message", `${socket.id} joined ${channelName}`);
  });

  // Leave channel
  socket.on("leaveChannel", (channelName) => {
    socket.leave(channelName);
    socket.to(channelName).emit("message", `${socket.id} left ${channelName}`);
  });

  // Send message inside the channel
  socket.on("sendMessage", ({ channel, message }) => {
    io.to(channel).emit("message", {
      sender: socket.id,
      message,
    });
  });
});
}
