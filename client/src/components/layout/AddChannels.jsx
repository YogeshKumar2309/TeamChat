import { Minus, Plus } from 'lucide-react'
import React from 'react'

const AddChannels = ({isOpenSidebar,showNewChannel,newChannelName,handleCreateChannel,setNewChannelName,setShowNewChannel}) => {
  return (
    <div>
         {isOpenSidebar && (
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase text-purple-300">Channels</h2>
            <button
              onClick={() => setShowNewChannel(!showNewChannel)}
              className="p-1 hover:bg-purple-700 rounded"
            >
              {!showNewChannel ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
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


    </div>
  )
}

export default AddChannels