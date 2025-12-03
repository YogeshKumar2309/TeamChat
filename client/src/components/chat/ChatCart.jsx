import React from 'react';
import { Send, Hash, Users, Circle } from 'lucide-react';

const ChatCart = ({
  currentChannel,
  messages,
  newMessage,
  setNewMessage,
  handleSendMessage,
  loadMoreMessages,
  onlineUsers,
  messagesEndRef,
  socket
}) => {
  const channelMessages = currentChannel ? messages[currentChannel.id] || [] : [];

  return (
    <div className="h-full grid grid-cols-1">

      <div className="flex-1 flex flex-col">
        {currentChannel ? (
          <>
            {/* Channel Header */}
            <div className="bg-white border-b px-4 py-3 shadow-sm flex items-center">
              <Hash className="w-5 h-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-bold text-gray-800">{currentChannel.channelName}</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {channelMessages.map((msg, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {msg.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-gray-900">{msg.username}</span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-800 mt-1">{msg.message || msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef}></div>
            </div>

            {/* Input */}
            <div className="bg-white border-t p-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={`Message #${currentChannel.name}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-purple-500"
                   disabled={!socket} 
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-100">
            <div className="text-center">
              <Hash className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Select a channel to start chatting</p>
            </div>
          </div>
        )}

        {/* Online Users */}
        {/* {onlineUsers.length > 0 && (
          <div className="bg-purple-900 text-white text-[10px] p-2 flex gap-3 items-center">
            <Users className="w-4 h-4" />
            <span>Online ({onlineUsers.length})</span>
            {onlineUsers.slice(0, 3).map((u) => (
              <span key={u.username} className="flex items-center gap-1">
                <Circle className="w-2 h-2 fill-green-400 text-green-400" />
                {u.username}
              </span>
            ))}
          </div>
        )} */}

      </div>
    </div>
  );
};

export default ChatCart;
