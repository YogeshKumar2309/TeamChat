export default function notificationHandler(io) {
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // When someone sends a notification
  socket.on("sendNotification", (data) => {
    console.log("Notification:", data);

    // Send to all users except sender
    socket.broadcast.emit("receiveNotification", data);

    // OR: send to everyone including sender
    // socket.emit("receiveNotification", data);
  });
});
}
