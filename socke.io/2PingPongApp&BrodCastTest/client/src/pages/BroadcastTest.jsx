import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SoketContext";

const BroadcastTest = () => {
    const socket = useSocket();
    const [message, setMessage] = useState("");
    const [allMessages, setAllMessages] = useState([]);

    useEffect(() => {
        if (!socket) return;

        // 🔴 3️⃣ Server se broadcast message listen
        socket.on("receive_message", (msg) => {
            setAllMessages((prev) => [...prev, msg]);
        });

        return () => socket.off("receive_message");
    }, [socket]);

    const sendMessage = () => {
        if (!message.trim()) return;

        // 🔵 1️⃣ Client server ko message bhejega
        socket.emit("send_message", message);
        setMessage("");
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl mb-4">Broadcast Test</h1>
            {/* Input */}
            <div className="flex gap-3 mb-4">
                <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="border p-2 rounded"
                    placeholder="Type a message"
                />
                <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Send
                </button>

            </div>

            {/* All broadcast messages */}
            <div className="bg-gray-100 p-4 rounded min-h-40">
                {allMessages.map((msg, index) => (
                    <p key={index} className="p-2 bg-white rounded mb-2 shadow">
                        {msg}
                    </p>
                ))}
            </div>
        </div>
    )


}

export default BroadcastTest;