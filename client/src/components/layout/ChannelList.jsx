import { Hash } from 'lucide-react'
import React from 'react'

const ChannelList = ({ 
    channels,
    currentChannel,
    setCurrentChannel,
    isOpenSidebar 
}) => {
    return (
        <div>
            {channels.map((channel) => (
                <button
                    key={channel._id}
                    onClick={() => setCurrentChannel(channel)}
                    className={`w-full text-left px-2 py-2 rounded mb-1 flex items-center transition-colors 
                        ${currentChannel?._id === channel._id
                            ? "bg-purple-600 text-white"
                            : "hover:bg-purple-700"
                        }`}
                >
                    <Hash className="w-4 h-4" />
                    {isOpenSidebar && (
                        <span className="ml-3">{channel.channelName}</span>
                    )}
                </button>
            ))}
        </div>
    )
}

export default ChannelList;
