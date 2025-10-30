import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  // Upsert profile safely after login
  useEffect(() => {
  if (user) navigate("/dashboard");
}, [user, navigate]);


  // Trigger Google OAuth login
  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin, // ensures redirect goes to your app
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error("Google sign-in error:", err.message);
      setError("Error signing in with Google: " + err.message);
    }
  };

  return (
    <div
      className="auth-container"
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div className="auth-box">
        <h2>Welcome to TakoFocus!</h2>

        {error && <p className="error" style={{ color: "red" }}>{error}</p>}

        <button
          onClick={handleGoogleSignIn}
          className="btn"
          style={{
            padding: "10px 30px",
          }}
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
