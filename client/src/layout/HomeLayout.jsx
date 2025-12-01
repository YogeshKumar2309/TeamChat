import React, { useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import { Outlet } from 'react-router-dom'

const HomeLayout = () => {
    const [isOpenSidebar, setIsOpenSidebar] = useState(true);
    return (
        <>
            <div className="h-screen flex bg-gray-100">
              
                    <div className="bg-purple-900 text-white flex flex-col">
                        <Sidebar setIsOpenSidebar={setIsOpenSidebar} isOpenSidebar={isOpenSidebar}/>
                    </div>
               
                <div className="flex-1 flex flex-col">
                    <Outlet />
                </div>
            </div>
        </>
    )
}

export default HomeLayout


