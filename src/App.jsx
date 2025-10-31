import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage"; // Email/password login/signup page
import Login from "./pages/Login"; // Welcome page with Tako image
import Dashboard from "./pages/Dashboard";
import FocusSession from "./pages/FocusSession";
import Tasks from "./pages/Tasks";
import About from "./pages/About";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const { user } = useAuth();
  

  // 🔁 Redirect "/#" or "/#/" to "/dashboard"
  useEffect(() => {
    if (window.location.hash === "#" || window.location.hash === "#/") {
      window.location.replace("/dashboard");
    }
  }, []);

  return (
    <>
      {/* Navbar always visible */}
      <Navbar user={user} />

      <Routes>
        {/* Root route: redirect based on login state */}
        <Route
          path="/"
          element={
            user ? <Navigate to="/dashboard" replace /> : <Login />
          }
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

        {/* Catch-all: redirect unknown paths to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
