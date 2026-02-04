import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SoketContext";



const NotificationBox = () => {
    const socket = useSocket();
    const [message, setMessage] = useState("");
    const [notifications, setNotifications] = useState([]);
    useEffect(() => {
        if (!socket) return;
        socket.on("receiveNotification", (data) => {
            setNotifications((prev) => [...prev, data]);
        });

        return () => socket.off("receiveNotification");
    }, []);

    const sendNotification = () => {
        if (!message.trim()) return;

        socket.emit("sendNotification", message);
        setMessage("");
    };

    return (
        <div className="p-4">
      <h2 className="text-xl font-bold mb-3">🔔 Broadcast Notifications</h2>

      <ul className="mb-4">
        {notifications.map((note, i) => (
          <li key={i} className="bg-yellow-100 p-2 my-1 rounded">
            🚨 {note}
          </li>
        ))}
      </ul>

      <input
        type="text"
        className="border p-2 mr-2"
        placeholder="Type notification..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendNotification()}
      />

      <button
        onClick={sendNotification}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Send
      </button>
    </div>
    )
}


export default NotificationBox