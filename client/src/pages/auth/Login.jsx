import { Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";

const Login = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-[#111827] text-white p-4">
      <div className="w-full max-w-md bg-[#1F2937] p-6 rounded-2xl shadow-[0_0_15px_#8B5CF6] border border-[#8B5CF6]">
        
        <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent">
          Welcome Back
        </h2>

        {/* Input fields */}
        <div className="space-y-4">
          <div className="flex items-center bg-[#111827] px-3 py-2 rounded-lg border border-[#8B5CF6]">
            <Mail className="w-5 h-5 text-[#EC4899] mr-2" />
            <input
              type="email"
              placeholder="Enter email"
              className="w-full bg-transparent outline-none text-sm placeholder-gray-500"
            />
          </div>

          <div className="flex items-center bg-[#111827] px-3 py-2 rounded-lg border border-[#8B5CF6]">
            <Lock className="w-5 h-5 text-[#EC4899] mr-2" />
            <input
              type="password"
              placeholder="Enter password"
              className="w-full bg-transparent outline-none text-sm placeholder-gray-500"
            />
          </div>
        </div>

        {/* Login button */}
        <button className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] p-3 rounded-lg mt-6 font-semibold text-sm hover:scale-105 transition-all">
          Login
        </button>

        {/* Register redirect */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-[#EC4899] font-bold hover:underline">
            Register
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
