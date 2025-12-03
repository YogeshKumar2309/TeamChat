import React, { useEffect } from "react";
import { useState } from "react";
import { io } from "socket.io-client";
import { useSocket } from "../context/SoketContext";

const SendUserName = () => {
    const socket = useSocket();
    const [userName, setUserName] = useState("");
    const [greeting, setGreting] = useState("");
      const [finalName, setFinalName] = useState("");

    useEffect(() => {
        if (!socket) return;

        // Emit the username to the server when it changes
        if (finalName) {
            socket.emit("sendUsername", finalName);
            console.log("Username sent to server:", finalName);
        }

        // Receive greeting from server
        socket.on("greeting", (msg) => {
            setGreting(msg);
            console.log("Server:", msg);
        });

        return () => {
            socket.off("greeting");
        };
    }, [finalName, socket]);
    return (
        <>
            <div className="p-4">
                <h2 className="text-2xl mb-4">Send User Name to Server</h2>
                <input
                    type="text"
                    placeholder="Enter your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="border p-2 mr-2"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            setFinalName(e.target.value);
                        }
                    }}
                />
                <button className="border rounded border-black p-2 bg-gray-200 hover:bg-gray-300 "
                onClick={() => setFinalName(userName)}
                >send</button>
                <p className="mt-4 text-lg">{greeting}</p>                
            </div>



        </>
    )
}

export default SendUserName