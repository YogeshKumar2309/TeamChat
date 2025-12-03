import React from 'react';
import { LogOut } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const LogoutBtn = ({ isOpenSidebar,setUser }) => {
    const api = useApi();
    const naviagate = useNavigate();

    const handleLogout = async () => {
        const res = await api.post("/auth/logout");
        if (res.success) {
            toast.success(api.successMsg || "Logged out successfully");
            naviagate("/login");
            setUser(null);
        } else {
            toast.error(api.errorMsg);
        }
    };
    return (
        <button
            disabled={api.loading}
            onClick={handleLogout}
            className="border-t border-purple-700 p-4 flex items-center hover:bg-purple-700 transition"
        >
            <LogOut className="w-4 h-4" />

            {isOpenSidebar && <span className="ml-3">{api.loading ? 'Logouting...': 'Logout'}</span>}
        </button>
    )
}

export default LogoutBtn