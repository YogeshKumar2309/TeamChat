
import { Routes, Route, Link } from "react-router-dom";
import OnlineUsers from "./pages/OnlineUsers";
import SendUserName from "./socket/SendUserName";



const PageNotFound = () => {
  return <h2 className="flex justify-center items-center h-screen bg-gray-50 text-rose-400 text-3xl">404 - Page Not Found</h2>;
};
const Home = () => {
  return <h2 className="flex justify-center items-center h-screen bg-gray-50  text-3xl">Home page socket !</h2>;
};

const App = () => {
  return (
    <>
      <div>
        <nav className="p-4 bg-gray-100 flex gap-4">
          <Link to="/">soket</Link>        
          <Link to="/sendUserName">Send UserName</Link>        
          </nav>

        <OnlineUsers />


        <Routes>
          <Route path="/" element={<Home />} />  
          <Route path="/sendUserName" element={<SendUserName />} />  
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </div>
    </>
  )
}

export default App;