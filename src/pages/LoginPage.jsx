import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleGoogleSignIn() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    }
  }

  if (user) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isSignUp ? "Create an Account" : "Welcome Back"}</h2>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="error">{error}</p>}

          <button type="submit">
            {isSignUp ? "Sign Up" : "Log In"}
          </button>
        </form>

        {/* Google login button */}
        <div className="divider">
          <span>or</span>
        </div>

        <button onClick={handleGoogleSignIn} className="google-btn">
          {/* Minimal circle G icon */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              border: "1px solid white",
              marginRight: "8px",
              fontSize: "14px",
              fontWeight: "bold",
              color: "white",
            }}
          >
            G
          </div>
          Continue with Google
        </button>

        <p className="switch-mode">
          {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
          <span onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? "Log in" : "Sign up"}
          </span>
        </p>
      </div>
    </div>
  );
}
