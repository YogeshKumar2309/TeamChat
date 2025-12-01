import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";


const PublicRoute = ({ isAuthenticated, isCheckingAuth, children }) => {
    if (isCheckingAuth) return <div className="flex justify-center items-center h-screen">
        <Loader2 />;
    </div>

    // If user is already authenticated, redirect to home
    return isAuthenticated ? <Navigate to="/" /> : children;
};

export default PublicRoute;