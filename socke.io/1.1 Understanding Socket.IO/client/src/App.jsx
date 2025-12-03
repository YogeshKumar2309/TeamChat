
import { Routes, Route, Link } from "react-router-dom";
import SocketTest from "./socket/SocketTest";
import { SocketProvider } from "./context/SoketContext";
import Test from "./pages/Test";


const PageNotFound = () => {
  return <h2 className="flex justify-center items-center h-screen bg-gray-50 text-rose-400 text-3xl">404 - Page Not Found</h2>;
};

const App = () => {
  return (
    <>
      <div>
        <nav className="p-4 bg-gray-100 flex gap-4">


          <Link to="/">soket</Link>
          <Link to="/test">test</Link>

        </nav>
        <SocketProvider>
          <Routes>

            {/* <Route path="/" element={<SocketTest />} /> */}


            <Route path="/test" element={<Test />} />


            <Route path="*" element={<PageNotFound />} />

          </Routes>
        </SocketProvider>
      </div>
    </>
  )
}

export default App;