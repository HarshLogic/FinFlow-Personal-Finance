import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { changePassword } from "../api";
import { common, themes } from "../shared";
import { User, Mail, Shield, Calendar, Key, AlertCircle, CheckCircle } from "lucide-react";

const C = themes.dark;

export default function UserProfile() {
  const { user } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      await changePassword({ currentPassword, newPassword });
      setSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto", color: C.text }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
        <User size={28} color={C.gold} />
        User Profile
      </h2>

      <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        {/* Profile Info Card */}
        <div style={{ ...common.card, display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, borderBottom: `1px solid ${C.border}`, paddingBottom: 12, marginBottom: 4 }}>Account Details</h3>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: C.surface, padding: 8, borderRadius: 8 }}><Shield size={20} color={C.gold} /></div>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>User ID</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{user?.userId}</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: C.surface, padding: 8, borderRadius: 8 }}><Mail size={20} color={C.gold} /></div>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>Email</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{user?.email}</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: C.surface, padding: 8, borderRadius: 8 }}><User size={20} color={C.gold} /></div>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>Account Type</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{user?.authMethod || "Email & Password"}</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: C.surface, padding: 8, borderRadius: 8 }}><Calendar size={20} color={C.gold} /></div>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>Member Since</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{formatDate(user?.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div style={{ ...common.card, display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, borderBottom: `1px solid ${C.border}`, paddingBottom: 12, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <Key size={20} />
            Change Password
          </h3>
          
          {user?.authMethod === "Google OAuth" ? (
            <div style={{ background: C.surface, padding: 16, borderRadius: 8, fontSize: 14, color: C.muted, lineHeight: 1.5 }}>
              Your account is managed via Google Sign-In. You cannot change your password here. Please manage your security settings directly through your Google account.
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {error && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "10px 14px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}
              
              {success && (
                <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "10px 14px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={16} /> {success}
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: 13, color: C.muted, marginBottom: 6 }}>Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ ...common.input, width: "100%", background: C.surface, padding: "10px 14px" }}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, color: C.muted, marginBottom: 6 }}>New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ ...common.input, width: "100%", background: C.surface, padding: "10px 14px" }}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, color: C.muted, marginBottom: 6 }}>Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ ...common.input, width: "100%", background: C.surface, padding: "10px 14px" }}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...common.button,
                  background: C.gold,
                  color: "#0D0F14",
                  fontWeight: 600,
                  marginTop: 8,
                  padding: "12px 16px",
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Updating..." : "Change Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
