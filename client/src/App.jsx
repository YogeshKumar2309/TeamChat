
import { Routes, Route, Link } from "react-router-dom";
import HomeLayout from "./layout/HomeLayout";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import NotFound from "./pages/pageNotFound/NotFound";
import Home from "./pages/user/Home";
import { Toaster } from "react-hot-toast";
import { useApi } from "./hooks/useApi";
import { useEffect, useState } from "react";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";

const App = () => {
  const api = useApi();
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const getUser = async () => {
    const res = await api.get("/api/auth/me");
    setUser(res.data?.user);
    setCheckingAuth(false);
  }

  useEffect(() => {
    getUser();
  }, []);


  const isAuthenticated = !!user;

  return (
    <>
      <Toaster position="top-right" />
      <Routes>

        <Route element={<ProtectedRoute
          isAuthenticated={isAuthenticated}
          isCheckingAuth={checkingAuth}
        />} >
          <Route path="/" element={<HomeLayout setUser={setUser} user={user}/>} >
            <Route index element={<Home />} />
          </Route>
        </Route>



        <Route path="/login" element={
          <PublicRoute
            isAuthenticated={isAuthenticated}
            isCheckingAuth={checkingAuth}>
            <Login  setUser={setUser}/>
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute
            isAuthenticated={isAuthenticated}
            isCheckingAuth={checkingAuth}>
            <Register setUser={setUser} />
          </PublicRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>

    </>
  )
}

export default App;