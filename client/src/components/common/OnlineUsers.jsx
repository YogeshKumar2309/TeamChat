import { Circle, Users } from 'lucide-react'
import React from 'react'

const OnlineUsers = ({isOpenSidebar, onlineUsers}) => {
  return (
    <>
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
    
    </>
  )
}

export default OnlineUsers