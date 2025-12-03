import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  const SOCKET_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!SOCKET_URL) {
      console.error("SOCKET_URL is not defined in .env");
      return;
    }

    const s = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    s.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    s.on("connect", () => {
      console.log("Socket connected:", s.id);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
