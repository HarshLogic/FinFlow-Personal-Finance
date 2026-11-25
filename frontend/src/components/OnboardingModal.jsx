import React, { useState } from "react";
import { completeOnboarding, dismissOnboarding } from "../api";
import { Sparkles, X } from "lucide-react";

export default function OnboardingModal({ isOpen, onClose, onCompleted, C }) {
  const [emergencyFund, setEmergencyFund] = useState(false);
  const [healthInsurance, setHealthInsurance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // Real-time calculated score (backend validates and persists)
  const currentScore = (emergencyFund ? 50 : 0) + (healthInsurance ? 50 : 0);

  const getClassification = (score) => {
    if (score === 100) return { label: "Financial Foundation Complete", color: C?.green || "#4ADE80" };
    if (score === 50) return { label: "Building Your Financial Foundation", color: C?.accent || "#2F6BFF" };
    return { label: "Starting Your Financial Journey", color: C?.muted || "#A8A294" };
  };

  const classification = getClassification(currentScore);

  const handleSaveAndContinue = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await completeOnboarding({
        milestones: {
          emergencyFund,
          healthInsurance,
        },
      });
      if (onCompleted) onCompleted(res.data?.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save foundation milestones");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await dismissOnboarding();
      if (onClose) onClose();
    } catch (_err) {
      // Non-blocking: close even if dismiss endpoint fails
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: C?.surface || "#282826",
          border: `1px solid ${C?.border || "#3D3D37"}`,
          borderRadius: "16px",
          width: "100%",
          maxWidth: "540px",
          padding: "28px",
          boxShadow: C?.shadowLg || "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          color: C?.text || "#D8CBB3",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleSkip}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "transparent",
            border: "none",
            color: C?.muted || "#9CA3AF",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "6px",
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <div
            style={{
              padding: "8px",
              borderRadius: "10px",
              background: "rgba(245, 158, 11, 0.15)",
              color: "#F59E0B",
            }}
          >
            <Sparkles size={22} />
          </div>
          <h2
            id="onboarding-title"
            style={{
              fontSize: "1.35rem",
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Build Your Financial Foundation
          </h2>
        </div>

        <p
          style={{
            fontSize: "0.9rem",
            color: C?.muted || "#9CA3AF",
            lineHeight: 1.5,
            marginBottom: "20px",
          }}
        >
          Before building wealth, protect yourself financially. Complete these two simple milestones
          to understand where you stand in your financial journey.
        </p>

        {/* Live Score Display */}
        <div
          style={{
            padding: "16px",
            borderRadius: "12px",
            background: C?.cardBg || "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${C?.border || "#374151"}`,
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: C?.muted || "#9CA3AF" }}>
              Financial Foundation Score
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: classification.color, marginTop: "2px" }}>
              {classification.label}
            </div>
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: classification.color,
              display: "flex",
              alignItems: "baseline",
              gap: "2px",
            }}
          >
            {currentScore}
            <span style={{ fontSize: "0.9rem", fontWeight: 500, color: C?.muted || "#9CA3AF" }}>/100</span>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#FCA5A5",
              fontSize: "0.85rem",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {/* Checklist */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          {/* Milestone 1: Emergency Fund */}
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              padding: "16px",
              borderRadius: "12px",
              background: emergencyFund ? "rgba(16, 185, 129, 0.08)" : (C?.cardBg || "rgba(255, 255, 255, 0.02)"),
              border: `1px solid ${emergencyFund ? "rgba(16, 185, 129, 0.4)" : (C?.border || "#374151")}`,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <input
              type="checkbox"
              checked={emergencyFund}
              onChange={(e) => setEmergencyFund(e.target.checked)}
              aria-label="I have an emergency fund"
              style={{
                marginTop: "4px",
                width: "18px",
                height: "18px",
                accentColor: "#10B981",
                cursor: "pointer",
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>I have an emergency fund.</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#10B981",
                  }}
                >
                  +50 pts
                </span>
              </div>
              <p style={{ fontSize: "0.82rem", color: C?.muted || "#9CA3AF", marginTop: "4px", lineHeight: 1.4, margin: "4px 0 0 0" }}>
                I have accessible emergency savings covering at least three months of essential expenses. Six months is a recommended target for additional protection.
              </p>
            </div>
          </label>

          {/* Milestone 2: Health Insurance */}
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              padding: "16px",
              borderRadius: "12px",
              background: healthInsurance ? "rgba(59, 130, 246, 0.08)" : (C?.cardBg || "rgba(255, 255, 255, 0.02)"),
              border: `1px solid ${healthInsurance ? "rgba(59, 130, 246, 0.4)" : (C?.border || "#374151")}`,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <input
              type="checkbox"
              checked={healthInsurance}
              onChange={(e) => setHealthInsurance(e.target.checked)}
              aria-label="I have health insurance"
              style={{
                marginTop: "4px",
                width: "18px",
                height: "18px",
                accentColor: "#3B82F6",
                cursor: "pointer",
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>I have health insurance.</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: "rgba(59, 130, 246, 0.15)",
                    color: "#3B82F6",
                  }}
                >
                  +50 pts
                </span>
              </div>
              <p style={{ fontSize: "0.82rem", color: C?.muted || "#9CA3AF", marginTop: "4px", lineHeight: 1.4, margin: "4px 0 0 0" }}>
                I am covered by an active health insurance policy.
              </p>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              border: `1px solid ${C?.border || "#374151"}`,
              background: "transparent",
              color: C?.text || "#F9FAFB",
              fontSize: "0.88rem",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Skip for Now
          </button>
          <button
            type="button"
            onClick={handleSaveAndContinue}
            disabled={loading}
            style={{
              padding: "10px 22px",
              borderRadius: "10px",
              border: "none",
              background: C?.accent || "#2F6BFF",
              color: "#FFFFFF",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: C?.shadowSm,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
