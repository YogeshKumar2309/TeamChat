

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import ChatCart from "./ChatCart";

// Helper function to get token from cookies
const getTokenFromCookies = () => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'token') {
      return value;
    }
  }
  return null;
};

const Chat = () => {
  const { currentChannel } = useOutletContext();
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const previousChannelRef = useRef(null);

  const SOCKET_URL = import.meta.env.VITE_API_URL;

  // Initialize socket connection once
  useEffect(() => {
    // Try localStorage first, then cookies
    let token = localStorage.getItem("token");
    if (!token) {
      token = getTokenFromCookies();
    }

    if (!token) {
      toast.error("Authentication required");
      return;
    }

    console.log("Token found, connecting to socket...");

    const socketConnection = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true, // Important for cookies
    });

    socketConnection.on("connect", () => {
      console.log("Socket connected successfully");
      setIsConnected(true);
      socketConnection.emit("join-server", token);
    });

    socketConnection.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socketConnection.on("online-users", (users) => {
      console.log("Online users updated:", users);
      setOnlineUsers(Object.values(users));
    });

    socketConnection.on("channel-messages", (msgs) => {
    //   console.log("Received channel messages:", msgs);
      if (!msgs || !msgs.channelId) return;
      setMessages((prev) => ({ ...prev, [msgs.channelId]: msgs.messages }));
    });

    socketConnection.on("new-message", (msg) => {
      console.log("New message received:", msg);
      if (!msg || !msg.channelId) return;
      setMessages((prev) => {
        const channelMsgs = prev[msg.channelId] || [];
        // Prevent duplicate messages
        if (channelMsgs.some(m => m._id === msg._id)) {
          return prev;
        }
        return { ...prev, [msg.channelId]: [...channelMsgs, msg] };
      });
    });

    socketConnection.on("connect_error", (err) => {
      toast.error("Connection error. Retrying...");
      console.error("Socket connection error:", err);
      setIsConnected(false);
    });

    socketConnection.on("error", (err) => {
      toast.error(err.message || "An error occurred");
      console.error("Socket error:", err);
    });

    setSocket(socketConnection);

    return () => {
      console.log("Cleaning up socket connection");
      socketConnection.disconnect();
    };
  }, [SOCKET_URL]);

  // Handle channel switching
  useEffect(() => {
    if (!socket || !currentChannel) return;

    const currentChannelId = currentChannel._id || currentChannel.id;
    const previousChannelId = previousChannelRef.current;

    // console.log("Channel changed:", { previousChannelId, currentChannelId });

    // Leave previous channel
    if (previousChannelId && previousChannelId !== currentChannelId) {
      console.log("Leaving channel:", previousChannelId);
      socket.emit("leave-channel", previousChannelId);
    }

    // Join new channel
    // console.log("Joining channel:", currentChannelId);
    socket.emit("join-channel", currentChannelId);

    // Request messages if not already loaded
    if (!messages[currentChannelId]) {
      console.log("Requesting messages for channel:", currentChannelId);
      socket.emit("get-channel-messages", { channelId: currentChannelId });
    }

    previousChannelRef.current = currentChannelId;
  }, [socket, currentChannel, messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, currentChannel]);

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !currentChannel || !socket || !isConnected) {
      if (!isConnected) {
        toast.error("Not connected. Please wait...");
      }
      return;
    }

    const channelId = currentChannel._id || currentChannel.id;

    console.log("Sending message:", { channelId, message: newMessage });

    socket.emit("send-message", {
      channelName: currentChannel.channelName,
      channelId: channelId,
      message: newMessage.trim(),
    });

    setNewMessage("");
  }, [newMessage, currentChannel, socket, isConnected]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const loadMoreMessages = useCallback(() => {
    if (!socket || !currentChannel) return;

    const channelId = currentChannel._id || currentChannel.id;
    const currentMessages = messages[channelId] || [];

    if (currentMessages.length === 0) return;

    const oldestMessage = currentMessages[0];

    console.log("Loading more messages before:", oldestMessage.createdAt);

    socket.emit("get-more-messages", {
      channelId: channelId,
      before: oldestMessage.createdAt || oldestMessage.timestamp,
      limit: 50,
    });
  }, [socket, currentChannel, messages]);

  return (
    <ChatCart
      currentChannel={currentChannel}
      messages={messages}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      handleSendMessage={handleSendMessage}
      handleKeyPress={handleKeyPress}
      loadMoreMessages={loadMoreMessages}
      onlineUsers={onlineUsers}
      messagesEndRef={messagesEndRef}
      socket={socket}
      isConnected={isConnected}
    />
  );
};

export default Chat;

