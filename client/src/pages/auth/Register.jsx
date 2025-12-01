import { Link, useNavigate } from "react-router-dom";
import { Mail, User, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { useApi } from "../../hooks/useApi";
import toast from "react-hot-toast";

const Register = ({setUser}) => {
  const api = useApi();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    const res = await api.post("/auth/register", data);

    if (res.success && res.data?.user) {
      setUser(res.data.user);
      toast.success(api.successMsg);
      navigate("/");
    } else {
      toast.error(api.errorMsg);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#111827] text-white p-4">
      <div className="w-full max-w-md bg-[#1F2937] p-6 rounded-2xl shadow-[0_0_15px_#8B5CF6] border border-[#8B5CF6]">
        
        <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent">
          Create Account
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Username Field */}
          <div>
            <div className="flex items-center bg-[#111827] px-3 py-2 rounded-lg border border-[#8B5CF6]">
              <User className="w-5 h-5 text-[#EC4899] mr-2" />
              <input
                type="text"
                placeholder="Enter username"
                className="w-full bg-transparent outline-none text-sm placeholder-gray-500"
                {...register("username", { required: "Username is required ❗", minLength: { value: 3, message: "Minimum 3 characters required" } })}
              />
            </div>
            {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
          </div>

          {/* Email Field */}
          <div>
            <div className="flex items-center bg-[#111827] px-3 py-2 rounded-lg border border-[#8B5CF6]">
              <Mail className="w-5 h-5 text-[#EC4899] mr-2" />
              <input
                type="email"
                placeholder="Enter email"
                className="w-full bg-transparent outline-none text-sm placeholder-gray-500"
                {...register("email", { required: "Email is required ❗", pattern: { value: /^\S+@\S+$/i, message: "Enter a valid email" } })}
              />
            </div>
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center bg-[#111827] px-3 py-2 rounded-lg border border-[#8B5CF6]">
              <Lock className="w-5 h-5 text-[#EC4899] mr-2" />
              <input
                type="password"
                placeholder="Create password"
                className="w-full bg-transparent outline-none text-sm placeholder-gray-500"
                {...register("password", { required: "Password is required ❗", minLength: { value: 6, message: "Minimum 6 characters required" } })}
              />
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* Register Button */}
          <button
            disabled={api.loading}
            type="submit"
            className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] p-3 rounded-lg mt-6 font-semibold text-sm hover:scale-105 transition-all"
          >
            {api.loading ? 'Loading...' : 'Register'}
          </button>

          {/* Login Redirect */}
          <p className="text-center text-xs text-gray-400 mt-4">
            Already have an account?{" "}
            <Link to="/" className="text-[#EC4899] font-bold hover:underline">
              Login
            </Link>
          </p>

        </form>
      </div>
    </div>
  );
};

export default Register;
