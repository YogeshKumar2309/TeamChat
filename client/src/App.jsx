
import { Routes, Route, Link } from "react-router-dom";
import HomeLayout from "./layout/HomeLayout";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import NotFound from "./pages/pageNotFound/NotFound";
import Home from "./pages/user/Home";

const App = () => {

  const user = {
    name: "Yogesh Kumar",
    age: 22,
    email: "yogesh@gmail.com",
  }

  // const user = null;

  const isAuthenticated = !!user;

  return (
    <>
      <Routes>
        {isAuthenticated ? (
          <>
            <Route path="/" element={<HomeLayout />} >
              <Route path="/" element={<Home />} />
            </Route>
          </>
        ) : (
          <>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </>
        )}
        <Route path="*" element={<NotFound />} />
      </Routes>

    </>
  )
}

export default App;