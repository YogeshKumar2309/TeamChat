import React from 'react'
import { useSocket } from '../context/SoketContext';
import { useState } from 'react';
import { useEffect } from 'react';

const Channels = () => {
    const socket = useSocket();
    const [currentChannel, setCurrentChannel] = useState("");
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");

    // Join channel
    const joinChannel = (ch) => {
        if (currentChannel) {
            socket.emit("leaveChannel", currentChannel);
        }

        socket.emit("joinChannel", ch);
        setCurrentChannel(ch);
         setMessages([]);  
    };

    // Listen to message ONLY once
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (msg) => {
            setMessages((prev) => [...prev, msg]);
        };

        socket.on("message", handleMessage);

        // cleanup to prevent multiple listeners
        return () => {
            socket.off("message", handleMessage);
        };
    }, [socket]);

    const sendMessage = () => {
        socket.emit("sendMessage", { channel: currentChannel,  message: inputMessage, });

         setInputMessage(""); 
    };

    return (
        <div>
            <h2>Channels</h2>
            <div className='flex justify-between mx-20 '>
                <button
                    onClick={() => joinChannel("General")}
                    className='rounded-2xl p-4 bg-gray-200'
                >Join General</button>
                <button
                    className='rounded-2xl p-4 bg-gray-200'
                    onClick={() => joinChannel("Dev")}>Join Dev</button>
            </div>

            <br /><br />




            <div className='mt-10 border h-[70vh] mx-2 rounded-2xl p-4 overflow-y-scroll fixed bottom-0 left-0 right-0 bg-white mb-6 '>
                <h3 className='text-rose-400 bg-blue-50 px-4 py-2 rounded-2xl flex justify-center mb-2'>Current Channel: <span className='font-bold text-yellow-600'>{currentChannel || "No channel selected"} </span></h3>
                <h3 className='text-blue-600 bg-blue-50 px-4 py-2 rounded-2xl flex justify-center'>Messages</h3>
                {messages.map((m, i) => (
                    <p key={i}>

                        <span className='text-[8px]'>  {JSON.stringify(m.sender)}</span>
                        <span>  {JSON.stringify(m.message)}</span>
                    </p>
                ))}
                <div
                    className='flex justify-center mt-4 mx-auto  p-2 rounded-2xl fixed bottom-8 right-4 w-[99vw]'
                >
                    <input
                     type="text" 
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        className='border p-2 rounded-2xl w-[75%]'
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                sendMessage()
                            }
                        }}
                    />
                    <button disabled={!currentChannel} onClick={sendMessage}
                        className='bg-blue-500 text-white p-2 ml-2 rounded-2xl disabled:bg-gray-800'>
                        Send Message
                    </button>
                </div>
            </div>



        </div>
    )
}

export default Channels



