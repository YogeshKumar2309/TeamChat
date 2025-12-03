import React, { useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import { Outlet } from 'react-router-dom'

const HomeLayout = ({ setUser, user }) => {
    const [isOpenSidebar, setIsOpenSidebar] = useState(true);
    const [currentChannel, setCurrentChannel] = useState(null);
    return (
        <>
            <div className="h-screen flex bg-gray-100">

                <div className="bg-purple-900 text-white flex flex-col">
                    <Sidebar setIsOpenSidebar={setIsOpenSidebar} isOpenSidebar={isOpenSidebar}
                        setUser={setUser}
                        user={user}
                        currentChannel={currentChannel}
                        setCurrentChannel={setCurrentChannel}
                    />
                </div>

                <div className="flex-1 flex flex-col">
                    <Outlet
                        context={{
                            currentChannel,
                        }} />
                </div>
            </div>
        </>
    )
}

export default HomeLayout


