import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SoketContext";

const PingPong = () => {
    const socket = useSocket();
    const [connected, setConnected] = useState(false);
    const [pong, setPong] = useState(false);

    useEffect(() => {
        if (!socket) return;

        const onConnect = () => setConnected(true);
        const onDisconnect = () => setConnected(false);

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        socket.on("pong", () => {
            console.log("PONG received!");
            setPong(true);
        });

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("pong");
        };
    }, [socket]);

    const sendPing = () => {
        socket.emit("ping");
        console.log("PING sent!");
    };
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-3xl mb-4">Ping-Pong Test</h1>
            <p>{connected ? "🟢 Connected" : "🔴 Not Connected"}</p>

            <button
                onClick={sendPing}
                className="mt-4 p-3 bg-blue-500 text-white rounded"
            >
                Send Ping
            </button>

            {pong && <p className="mt-4 text-green-600">PONG received!</p>}
        </div>
    )
}

export default PingPong