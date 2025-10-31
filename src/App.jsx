import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FocusSession from "./pages/FocusSession";
import Tasks from "./pages/Tasks";
import About from "./pages/About";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const { user } = useAuth();
  const location = useLocation();

  // Redirect "/#" or "/#/" to "/dashboard"
  useEffect(() => {
    if (window.location.hash === "#" || window.location.hash === "#/") {
      window.location.replace("/dashboard");
    }
  }, []);

  return (
    <>
      <Navbar user={user} />

      {/* AnimatePresence enables exit animations */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <Routes location={location} key={location.pathname}>
            {/* Root route: redirect based on login state */}
            <Route
              path="/"
              element={user ? <Navigate to="/dashboard" replace /> : <Login />}
            />

            {/* Public route */}
            <Route path="/about" element={<About />} />

            {/* Login/signup page */}
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

            {/* Catch-all: redirect unknown paths */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
