import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SoketContext.jsx";

const OnlineUsers = () => {
  const socket = useSocket();
  const [online, setOnline] = useState(0);

  useEffect(() => {
    if (!socket) return;

    // listen for online users count
    socket.on("onlineUsers", (count) => {
      setOnline(count);
    });

    // cleanup
    return () => socket.off("onlineUsers");
  }, [socket]);

  return (
    <div className="p-2 bg-blue-200 text-blue-800 rounded shadow m-2">
      Online Users: {online}
    </div>
  );
};

export default OnlineUsers;
