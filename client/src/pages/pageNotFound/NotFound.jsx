import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#111827] text-white">
      
      <h1 className="text-4xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent">
        404 - Page Not Found!
      </h1>

      <Link 
        to="/" 
        className="mt-6 px-5 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] rounded-lg shadow-[0_0_12px_#8B5CF6] hover:scale-105 transition-transform"
      >
        Go to Home
      </Link>

    </div>
  );
};

export default NotFound;
