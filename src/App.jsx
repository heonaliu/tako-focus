import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import FocusSession from "./pages/FocusSession";
import Tasks from "./pages/Tasks";
import About from "./pages/About";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const { user } = useAuth(); // 👈 use the AuthProvider context

  return (
    <>
      {/* Only show Navbar if logged in */}
      {user && <Navbar user={user} />}

      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={!user ? <LoginPage /> : <Navigate to="/dashboard" />}
        />
        <Route path="/about" element={<About />} />

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
      </Routes>
    </>
  );
}
