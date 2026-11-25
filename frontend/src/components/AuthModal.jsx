import React, { useState } from "react";
import { registerUser, loginUser, googleLogin } from "../api";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const { data } = await loginUser({ identifier: email || userId, password });
        login(data.token, data.user);
      } else {
        const { data } = await registerUser({ email, userId, password });
        login(data.token, data.user);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { data } = await googleLogin(credentialResponse.credential);
      login(data.token, data.user);
      onClose();
    } catch (err) {
      setError("Google Login failed");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(6px)",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#282826",
          border: "1px solid #3D3D37",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "440px",
          padding: "28px",
          color: "#D8CBB3",
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#FFFFFF", margin: 0, letterSpacing: "-0.02em" }}>
            {isLogin ? "Log In" : "Sign Up"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#A8A294",
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "6px",
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            style={{
              marginBottom: "16px",
              padding: "10px 14px",
              background: "rgba(248, 113, 113, 0.15)",
              border: "1px solid rgba(248, 113, 113, 0.3)",
              borderRadius: "8px",
              color: "#F87171",
              fontSize: "0.85rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              background: "#1E1E1C",
              border: "1px solid #3D3D37",
              borderRadius: "10px",
              color: "#FFFFFF",
              fontSize: "0.9rem",
              outline: "none",
            }}
            required={!isLogin}
          />
          {!isLogin && (
            <input
              type="text"
              placeholder="User ID (Username)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                background: "#1E1E1C",
                border: "1px solid #3D3D37",
                borderRadius: "10px",
                color: "#FFFFFF",
                fontSize: "0.9rem",
                outline: "none",
              }}
              required
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              background: "#1E1E1C",
              border: "1px solid #3D3D37",
              borderRadius: "10px",
              color: "#FFFFFF",
              fontSize: "0.9rem",
              outline: "none",
            }}
            required
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: "#2F6BFF",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "0.92rem",
              borderRadius: "10px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "background 0.2s ease",
            }}
          >
            {loading ? "Please wait..." : isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <div style={{ margin: "20px 0", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ height: "1px", background: "#3D3D37", flex: 1 }} />
          <span style={{ fontSize: "0.78rem", color: "#A8A294", textTransform: "uppercase", letterSpacing: "0.05em" }}>OR</span>
          <div style={{ height: "1px", background: "#3D3D37", flex: 1 }} />
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google Login Failed")}
            theme="filled_black"
            size="large"
            width="350px"
          />
        </div>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "0.85rem", color: "#A8A294" }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: "transparent",
              border: "none",
              color: "#2F6BFF",
              fontWeight: 600,
              cursor: "pointer",
              padding: "0 4px",
              textDecoration: "underline",
            }}
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
