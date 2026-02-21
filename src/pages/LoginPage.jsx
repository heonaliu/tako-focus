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
    if (user) navigate("/focus");
  }, [user, navigate]);

  // Trigger Google OAuth login
  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: undefined, // IMPORTANT: popup login
        },
      });

      if (error) throw error;

      console.log("Login successful!", data);
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

        {error && (
          <p className="error" style={{ color: "red" }}>
            {error}
          </p>
        )}

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
