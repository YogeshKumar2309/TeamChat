import React, { useEffect } from "react";
import { useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3001"; // Server ka URL

const SocketTest = () => {

    const [connected, setConnected] = useState(false);

    useEffect(() => {
        // 1️⃣ Socket connection initialize karna
        const socketConnection = io(SOCKET_URL, {
            transports: ["websocket", "polling"], // WebSocket preferred, polling fallback
        });

        // 2️⃣ Connection successful hone par
        socketConnection.on("connect", () => {
            console.log("✅ Connected to server:", socketConnection.id);
            setConnected(true);
        });

        // 3️⃣ Server disconnect hone par
        socketConnection.on("disconnect", () => {
            console.log("❌ Disconnected from server");
        });

        // 4️⃣ Cleanup on unmount: connection close karna
        return () => {
            socketConnection.disconnect();
        };
    }, []);

    return (
        <div>
            <h2>Socket.IO React Test</h2>
            {connected && (
                <div className="p-2 mt-2 bg-green-200 text-green-800 rounded">
                    ✅ Connected! to Socket.IO Server
                </div>
            )}
        </div>
    );
};

export default SocketTest;

/* 
Explanation:

1️⃣ `io(SOCKET_URL, { transports: ["websocket", "polling"] })`:
   - Server se connect karta hai.
   - "websocket" preferred, agar fail ho to "polling".

2️⃣ `socketConnection.on("connect", ...)`:
   - Jab connection establish ho jaye.
   - `socketConnection.id` se unique socket id milegi.

3️⃣ `socketConnection.on("disconnect", ...)`:
   - Jab server disconnect ho jaye ya network issue aaye.
   
4️⃣ `return () => socketConnection.disconnect()`:
   - Component unmount hone par connection close ho jaye.
   - Memory leak aur unnecessary connection prevent hota hai.
*/
