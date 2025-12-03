import React, { useState } from "react";
import { Circle, Plus, Users, Hash, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { useApi } from "../../hooks/useApi";
import { useNavigate } from "react-router-dom";

const chatData = {
  user: { name: "Yogesh", status: "Online" },
  channels: [
    { id: 1, name: "general" },
    { id: 3, name: "engineering" }
  ],
  onlineUsers: [
    { id: 1, username: "alice" },
    { id: 2, username: "bob" },
  ]
};

const Sidebar = ({ isOpenSidebar, setIsOpenSidebar ,setUser}) => {
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [channels, setChannels] = useState(chatData.channels);
  const [currentChannel, setCurrentChannel] = useState(chatData.channels[0]);
  const [onlineUsers] = useState(chatData.onlineUsers);

  const api = useApi();
  const naviagate = useNavigate();

  const handleCreateChannel = () => {
    if (!newChannelName.trim()) return;
    const newChannel = {
      id: Date.now(),
      name: newChannelName.toLowerCase().replace(/\s+/g, "-")
    };
    setChannels((prev) => [...prev, newChannel]);
    setNewChannelName("");
    setShowNewChannel(false);
    setCurrentChannel(newChannel);
  };

  const handleLogout = async () => {
    const res = await api.post("/auth/logout");

    if (res.success) {
      toast.success(api.successMsg || "Logged out successfully");
      setUser(null);
      naviagate("/login");
    } else {
      toast.error(api.errorMsg);
    }
  };

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
            <span>{chatData.user.name}</span>
          </div>
        )}
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto p-4">
        {isOpenSidebar && (
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase text-purple-300">Channels</h2>
            <button
              onClick={() => setShowNewChannel(!showNewChannel)}
              className="p-1 hover:bg-purple-700 rounded"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}

        {showNewChannel && isOpenSidebar && (
          <div className="mb-3 flex gap-2">
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="channel-name"
              className="flex-1 px-2 py-1 text-sm bg-purple-700 rounded text-white placeholder-purple-400"
              onKeyDown={(e) => e.key === "Enter" && handleCreateChannel()}
            />
            <button
              onClick={handleCreateChannel}
              className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
            >
              Add
            </button>
          </div>
        )}

        {/* Channel List */}
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => setCurrentChannel(channel)}
            className={`w-full text-left px-2 py-2 rounded mb-1 flex items-center transition-colors ${currentChannel?.id === channel.id
                ? "bg-purple-600"
                : "hover:bg-purple-700"
              }`}
          >
            <Hash className="w-4 h-4" />
            {isOpenSidebar && <span className="ml-3">{channel.name}</span>}
          </button>
        ))}
      </div>

      {/* Online Users */}
      <div className="border-t border-purple-700 p-4">
        <div className="flex items-center mb-2">
          <Users className="w-4 h-4" />
          {isOpenSidebar && (
            <span className="ml-2 text-sm">Online ({onlineUsers.length})</span>
          )}
        </div>

        {onlineUsers.map((u) => (
          <div key={u.id} className="flex items-center text-sm mb-1">
            <Circle className="w-2 h-2 fill-green-400 text-green-400 mr-2" />
            {isOpenSidebar ? u.username : ""}
          </div>
        ))}
      </div>

      {/* Logout */}
      <button
       disabled={api.loading}
        onClick={handleLogout}
        className="border-t border-purple-700 p-4 flex items-center hover:bg-purple-700 transition"
      >
        <LogOut className="w-4 h-4" />
        {isOpenSidebar && <span className="ml-3">{api.loading ? "Logouting..." : "Logout"}</span>}
      </button>
    </div>
  );
};

export default Sidebar;
