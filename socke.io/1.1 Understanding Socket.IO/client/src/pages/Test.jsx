import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SoketContext";


const Test = () => {
  const socket = useSocket();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [socket]);

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
      <h2 className="text-3xl text-blue-600 mb-4">Test Page</h2>

      {connected ? (
        <div className="p-3 bg-green-200 text-green-900 rounded-lg shadow">
          ✅ Connected to Socket.IO Server
        </div>
      ) : (
        <div className="p-3 bg-red-200 text-red-900 rounded-lg shadow">
          ❌ Not Connected
        </div>
      )}
    </div>
  );
};

export default Test;
