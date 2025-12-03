import React, { useEffect, useState } from "react";
import { Circle } from "lucide-react";
import toast from "react-hot-toast";
import { useApi } from "../../hooks/useApi";
import LogoutBtn from "../common/LogoutBtn";
import OnlineUsers from "../common/OnlineUsers";
import ChannelList from "./ChannelList";
import AddChannels from "./AddChannels";

const chatData = {
  user: { name: "Yogesh", status: "Online" },
  channels: [
    { id: 1, name: "general" },
  ],
  onlineUsers: [
    { id: 1, username: "alice" },
    { id: 2, username: "bob" },
  ]
};

const Sidebar = ({ isOpenSidebar, setIsOpenSidebar, setUser, user,currentChannel, setCurrentChannel }) => {
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [channels, setChannels] = useState(chatData.channels);
  const [onlineUsers] = useState(chatData.onlineUsers);

  const api = useApi();


  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    const res = await api.post("/api/channel/create", { channelName: newChannelName });
    if (!res.success) {
      toast.error(api.errorMsg || "Failed to create channel");
      return;
    }
    toast.success(api.successMsg || "Channel created successfully");
    const newChannel = {
      id: Date.now(),
      name: newChannelName.toLowerCase().replace(/\s+/g, "-")
    };
    setChannels((prev) => [...prev, newChannel]);
    setNewChannelName("");
    setShowNewChannel(false);
    // setCurrentChannel(newChannel);
  };

  useEffect(() => {
    const fetchChannels = async () => {
      const res = await api.get("/api/channel/list");
      if (res.success) {
        setChannels(res.data);
        setCurrentChannel(res.data[0]);
      } else {
        toast.error(api.errorMsg || "Failed to fetch channels");
      }
    };
    fetchChannels();
  }, []);

// console.log(currentChannel);


  return (
    <div
      className={`h-screen bg-purple-900 text-white flex flex-col transition-all duration-300 ${isOpenSidebar ? "w-64" : "w-[70px]"
        }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-purple-700">
        {isOpenSidebar && (
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">TeamChat</h1>
            <span
              className="cursor-pointer text-xl hover:text-pink-500"
              onClick={() => setIsOpenSidebar(false)}
            >
              ✖
            </span>
          </div>
        )}
        {!isOpenSidebar && (
          <span
            className="cursor-pointer text-2xl hover:text-pink-500 flex justify-center"
            onClick={() => setIsOpenSidebar(true)}
          >
            ☰
          </span>
        )}
        {isOpenSidebar && (
          <div className="flex items-center mt-2 text-sm">
            <Circle className="w-2 h-2 fill-green-400 text-green-400 mr-2" />
            <span>{user?.username}</span>
          </div>
        )}
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto p-4">
       <AddChannels 
        isOpenSidebar={isOpenSidebar}
        showNewChannel={showNewChannel}
        newChannelName={newChannelName}
        handleCreateChannel={handleCreateChannel}
        setNewChannelName={setNewChannelName}
        setShowNewChannel={setShowNewChannel}
       />

        {/* Channel List */}
        <ChannelList
          channels={channels}
          currentChannel={currentChannel}
          setCurrentChannel={setCurrentChannel}
          isOpenSidebar={isOpenSidebar}
        />
      </div>

      {/* Online Users */}
      <OnlineUsers isOpenSidebar={isOpenSidebar} onlineUsers={onlineUsers} />

      {/* Logout */}
      <LogoutBtn isOpenSidebar={isOpenSidebar} setUser={setUser} />
    </div>
  );
};

export default Sidebar;


   