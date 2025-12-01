import { Loader2 } from "lucide-react";
import { Navigate, Outlet } from "react-router-dom";


const ProtectedRoute = ({ isAuthenticated,isCheckingAuth, redirectTo = "/login" }) => {
  if (isCheckingAuth) return <p className="flex justify-center items-center h-screen"><Loader2/>{" "} <>Checking auth...</></p>; // initial state
  return isAuthenticated ? <Outlet /> : <Navigate to={redirectTo} />;
};

export default ProtectedRoute;
