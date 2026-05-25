import { useState } from "react";
import { C } from "../shared";
import { loginUser, registerUser } from "../api";

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = isLogin ? await loginUser(formData) : await registerUser(formData);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("currency", res.data.currency);
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: 8,
    background: C.bg, border: `1px solid ${C.border}`,
    color: C.text, fontSize: 14, marginBottom: 16,
    boxSizing: "border-box"
  };

  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center",
      minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans',system-ui,sans-serif",
      color: C.text
    }}>
      <div style={{
        background: C.surface, padding: 40, borderRadius: 16,
        width: 360, border: `1px solid ${C.border}`,
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, background: C.gold, borderRadius: 12,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 800, color: "#0D0F14", marginBottom: 16
          }}>₹</div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>FinFlow</h2>
          <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        {error && <div style={{
          background: "#EF444422", color: C.red, padding: "10px 12px",
          borderRadius: 8, fontSize: 13, marginBottom: 16, border: `1px solid #EF444466`
        }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text" placeholder="Full Name" required style={inputStyle}
              value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          )}
          <input
            type="email" placeholder="Email Address" required style={inputStyle}
            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="password" placeholder="Password" required style={inputStyle}
            value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
          />
          <button type="submit" disabled={loading} style={{
            width: "100%", padding: 14, borderRadius: 8,
            background: C.gold, color: "#0D0F14", border: "none",
            fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            marginTop: 8
          }}>
            {loading ? "Please wait..." : (isLogin ? "Sign In" : "Sign Up")}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: C.muted }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
            style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", fontWeight: 600 }}
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
