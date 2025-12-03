
import { Routes, Route, Link } from "react-router-dom";
import OnlineUsers from "./pages/OnlineUsers";
import PingPong from "./pages/PingPong";
import BroadcastTest from "./pages/BroadcastTest";


const PageNotFound = () => {
  return <h2 className="flex justify-center items-center h-screen bg-gray-50 text-rose-400 text-3xl">404 - Page Not Found</h2>;
};

const App = () => {
  return (
    <>
      <div>
        <nav className="p-4 bg-gray-100 flex gap-4">


          <Link to="/">soket</Link>
          <Link to="/pingpong">pingpong</Link>
          <Link to="/broadcastTest">BroadcastTest</Link>


        </nav>

        <OnlineUsers />
        <Routes>

          {/* <Route path="/" element={<SocketTest />} /> */}



          <Route path="/pingpong" element={<PingPong />} />
          <Route path="/broadcastTest" element={<BroadcastTest />} />
          <Route path="*" element={<PageNotFound />} />


        </Routes>

      </div>

    </>
  )
}

export default App;