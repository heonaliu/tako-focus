import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "./context/AuthContext";
import takoIdle from "./assets/tako_idle.png";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FocusSession from "./pages/FocusSession";
import Tasks from "./pages/Tasks";
import About from "./pages/About";
import ProtectedRoute from "./components/ProtectedRoute";

// 🐙 Tako Loading Screen with Spinner
// 🐙 Tako Loading Screen with Centered Spinner
function LoadingScreen() {
  return (
    <motion.div
      className="loading-screen"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#faf8ff",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 9999,
      }}
    >
      <div
        className="tako-loader"
        style={{
          position: "relative",
          width: "180px",
          height: "180px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Spinner ring */}
        <div
          className="spinner-circle"
          style={{
            width: "180px",
            height: "180px",
            border: "8px solid #e5d9ff",
            borderTop: "8px solid #a78bfa",
            borderRadius: "50%",
            animation: "spin 1.4s linear infinite",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            boxShadow: "0 0 10px rgba(167, 139, 250, 0.4)",
          }}
        ></div>

        {/* Tako image inside circle */}
        <img
          src={takoIdle} // 🧩 Update to your correct path
          alt="Loading Tako"
          style={{
            width: "95px",
            height: "95px",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "float 3s ease-in-out infinite",
            zIndex: 2,
          }}
        />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-6px); }
        }
        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}


export default function App() {
  const { user } = useAuth();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  // 🧭 Redirect /# → /dashboard
  useEffect(() => {
    if (window.location.hash === "#" || window.location.hash === "#/") {
      window.location.replace("/dashboard");
    }
  }, []);

  // ⏳ Smooth loading transition between pages
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600); // fade duration
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <>
      <Navbar user={user} />

      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingScreen key="loader" />
        ) : (
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <Routes location={location} key={location.pathname}>
              <Route
                path="/"
                element={
                  user ? <Navigate to="/dashboard" replace /> : <Login />
                }
              />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute user={user}>
                    <Dashboard user={user} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute user={user}>
                    <Tasks user={user} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/focus"
                element={
                  <ProtectedRoute user={user}>
                    <FocusSession user={user} />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
