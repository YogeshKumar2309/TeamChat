export default function greetingWithUserNameHandler(io) {
  io.on("connection", (socket) => {
    console.log("User Connected for Greeting with UserName:", socket.id);

    // Listen for 'setUserName' event from client
    socket.on("sendUsername", (userName) => {
      console.log(`User Name set by ${socket.id}:`, userName);

      // Send greeting message back to the specific client
      socket.emit(
        "greeting",
        `Hello, ${userName}! Welcome to the Socket.IO server.`
      );
    });

    // Disconnect hone par
    socket.on("disconnect", () => {
      console.log("User Disconnected from Greeting with UserName:", socket.id);
    });
  });
}
