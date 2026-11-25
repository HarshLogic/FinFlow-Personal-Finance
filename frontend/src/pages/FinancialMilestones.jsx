import React, { useState, useEffect, useCallback } from "react";
import { getFinancialFoundation, updateFinancialMilestones } from "../api";
import {
  ShieldCheck,
  HeartPulse,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Sparkles,
  RefreshCw,
} from "lucide-react";

export default function FinancialMilestones({ C, onNavigate }) {
  const [foundation, setFoundation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const loadFoundation = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getFinancialFoundation();
      if (res.data?.success) {
        setFoundation(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load financial foundation milestones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFoundation();
  }, [loadFoundation]);

  const handleToggle = async (milestoneKey, currentValue) => {
    try {
      setUpdating(true);
      const res = await updateFinancialMilestones({
        milestone: milestoneKey,
        completed: !currentValue,
      });
      if (res.data?.success) {
        setFoundation(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update milestone");
    } finally {
      setUpdating(false);
    }
  };

  const emergencyFundCompleted = Boolean(foundation?.milestones?.emergencyFund?.completed);
  const healthInsuranceCompleted = Boolean(foundation?.milestones?.healthInsurance?.completed);
  const score = foundation?.score || 0;
  const completedCount = (emergencyFundCompleted ? 1 : 0) + (healthInsuranceCompleted ? 1 : 0);

  const getScoreColor = (sc) => {
    if (sc === 100) return C?.green || "#4ADE80";
    if (sc === 50) return C?.accent || "#2F6BFF";
    return C?.warning || "#FBBF24";
  };

  const scoreColor = getScoreColor(score);

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "1100px",
        margin: "0 auto",
        color: C?.text || "#D8CBB3",
        fontFamily: "'DM Sans',system-ui,sans-serif",
      }}
    >
      {/* Page Title */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
          <div
            style={{
              padding: "10px",
              borderRadius: "12px",
              background: `${C?.green || "#4ADE80"}20`,
              color: C?.green || "#4ADE80",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
              Financial Milestones & Foundation
            </h1>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.92rem", color: C?.muted || "#A8A294" }}>
              Foundational safety nets that protect you before wealth building and aggressive investing begin.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#FCA5A5",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button
            onClick={loadFoundation}
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: "none",
              color: "#FCA5A5",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              textDecoration: "underline",
            }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Top Banner: Score & Classification */}
      <div
        style={{
          background: C?.surface || "#282826",
          border: `1px solid ${C?.border || "#3D3D37"}`,
          borderRadius: "16px",
          padding: "28px",
          marginBottom: "24px",
          boxShadow: C?.shadowSm || "0 4px 12px rgba(0,0,0,0.15)",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: "24px",
          alignItems: "center",
        }}
      >
        {/* Score Dial / Ring */}
        <div
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            border: `6px solid ${scoreColor}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.15)",
          }}
        >
          <span style={{ fontSize: "1.75rem", fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
            {loading ? "..." : score}
          </span>
          <span style={{ fontSize: "0.75rem", color: C?.muted || "#A8A294", marginTop: "2px" }}>/ 100</span>
        </div>

        {/* Status and Progress Info */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 700,
                color: scoreColor,
                background: `${scoreColor}20`,
                padding: "3px 10px",
                borderRadius: "999px",
              }}
            >
              {foundation?.classification || "Assessing..."}
            </span>
            <span style={{ fontSize: "0.85rem", color: C?.muted || "#A8A294" }}>
              • {completedCount} of 2 milestones achieved
            </span>
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "6px 0 10px 0" }}>
            {score === 100
              ? "Your Financial Shield Is Fully Activated"
              : score === 50
              ? "You Have Built 50% of Your Foundation"
              : "Let's Build Your Core Financial Security"}
          </h2>

          {/* Progress bar */}
          <div
            style={{
              width: "100%",
              maxWidth: "460px",
              height: "8px",
              borderRadius: "999px",
              background: C?.border || "#3D3D37",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${score}%`,
                height: "100%",
                background: scoreColor,
                borderRadius: "999px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Milestone refresh / quick info */}
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "0.8rem", color: C?.muted || "#A8A294" }}>Self-Reported Assessment</div>
          <button
            onClick={loadFoundation}
            disabled={loading || updating}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: `1px solid ${C?.border || "#3D3D37"}`,
              background: "transparent",
              color: C?.text || "#D8CBB3",
              cursor: "pointer",
              fontSize: "0.82rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              alignSelf: "flex-end",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* 2 Key Milestones Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
        {/* Milestone 1: Emergency Fund */}
        <div
          style={{
            background: C?.surface || "#282826",
            border: `1px solid ${emergencyFundCompleted ? (C?.green || "#4ADE80") + "66" : (C?.border || "#3D3D37")}`,
            borderRadius: "16px",
            padding: "24px",
            position: "relative",
            transition: "all 0.25s ease",
            boxShadow: emergencyFundCompleted ? "0 4px 16px rgba(74, 222, 128, 0.08)" : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  padding: "10px",
                  borderRadius: "10px",
                  background: emergencyFundCompleted ? `${C?.green || "#4ADE80"}20` : "rgba(255, 255, 255, 0.05)",
                  color: emergencyFundCompleted ? (C?.green || "#4ADE80") : (C?.muted || "#A8A294"),
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C?.green || "#4ADE80" }}>MILESTONE 1</span>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "2px 0 0 0" }}>Emergency Fund</h3>
              </div>
            </div>

            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "999px",
                background: emergencyFundCompleted ? `${C?.green || "#4ADE80"}25` : "rgba(255,255,255,0.06)",
                color: emergencyFundCompleted ? (C?.green || "#4ADE80") : (C?.muted || "#A8A294"),
              }}
            >
              50 Points
            </span>
          </div>

          <p style={{ fontSize: "0.88rem", color: C?.muted || "#A8A294", lineHeight: 1.5, marginBottom: "18px" }}>
            Accessible emergency savings covering at least <strong>3 months</strong> of essential living expenses. 
            Six months is the recommended target for salaried professionals.
          </p>

          <div
            style={{
              padding: "12px",
              borderRadius: "10px",
              background: C?.cardBg || "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${C?.border || "#3D3D37"}`,
              fontSize: "0.82rem",
              lineHeight: 1.45,
              marginBottom: "20px",
            }}
          >
            💡 <strong>Why it matters:</strong> Without liquid reserves, any unexpected job disruption or medical expense
            forces you to sell investments at a loss or accumulate high-interest credit card debt.
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: updating ? "not-allowed" : "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={emergencyFundCompleted}
                onChange={() => handleToggle("emergencyFund", emergencyFundCompleted)}
                disabled={updating}
                aria-label="Toggle emergency fund completion"
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: C?.green || "#4ADE80",
                  cursor: "pointer",
                }}
              />
              <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                {emergencyFundCompleted ? "Completed (I have emergency savings)" : "Mark as Completed"}
              </span>
            </label>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate("affordability")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  background: "transparent",
                  border: `1px solid ${C?.border || "#3D3D37"}`,
                  color: C?.green || "#4ADE80",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                Set Goal <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Milestone 2: Health Insurance */}
        <div
          style={{
            background: C?.surface || "#282826",
            border: `1px solid ${healthInsuranceCompleted ? (C?.accent || "#2F6BFF") + "66" : (C?.border || "#3D3D37")}`,
            borderRadius: "16px",
            padding: "24px",
            position: "relative",
            transition: "all 0.25s ease",
            boxShadow: healthInsuranceCompleted ? "0 4px 16px rgba(47, 107, 255, 0.08)" : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  padding: "10px",
                  borderRadius: "10px",
                  background: healthInsuranceCompleted ? `${C?.accent || "#2F6BFF"}20` : "rgba(255, 255, 255, 0.05)",
                  color: healthInsuranceCompleted ? (C?.accent || "#2F6BFF") : (C?.muted || "#A8A294"),
                }}
              >
                <HeartPulse size={22} />
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C?.accent || "#2F6BFF" }}>MILESTONE 2</span>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "2px 0 0 0" }}>Health Insurance</h3>
              </div>
            </div>

            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "999px",
                background: healthInsuranceCompleted ? `${C?.accent || "#2F6BFF"}25` : "rgba(255,255,255,0.06)",
                color: healthInsuranceCompleted ? (C?.accent || "#2F6BFF") : (C?.muted || "#A8A294"),
              }}
            >
              50 Points
            </span>
          </div>

          <p style={{ fontSize: "0.88rem", color: C?.muted || "#A8A294", lineHeight: 1.5, marginBottom: "18px" }}>
            Active individual or family health insurance policy independent of corporate employer cover.
            Protects your wealth from soaring hospital costs.
          </p>

          <div
            style={{
              padding: "12px",
              borderRadius: "10px",
              background: C?.cardBg || "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${C?.border || "#3D3D37"}`,
              fontSize: "0.82rem",
              lineHeight: 1.45,
              marginBottom: "20px",
            }}
          >
            💡 <strong>Why it matters:</strong> Medical inflation in India is 12–14% p.a. Relying solely on corporate coverage
            leaves you exposed if you switch careers, take a sabbatical, or retire.
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: updating ? "not-allowed" : "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={healthInsuranceCompleted}
                onChange={() => handleToggle("healthInsurance", healthInsuranceCompleted)}
                disabled={updating}
                aria-label="Toggle health insurance completion"
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: C?.accent || "#2F6BFF",
                  cursor: "pointer",
                }}
              />
              <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                {healthInsuranceCompleted ? "Completed (I have health insurance)" : "Mark as Completed"}
              </span>
            </label>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate("rulebook")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  background: "transparent",
                  border: `1px solid ${C?.border || "#3D3D37"}`,
                  color: C?.accent || "#2F6BFF",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                Rule 02 <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Personalized Next Steps Box */}
      <div
        style={{
          background: C?.surface || "#282826",
          border: `1px solid ${C?.border || "#3D3D37"}`,
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <Sparkles size={20} color={C?.warning || "#FBBF24"} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Personalized Next Steps</h3>
        </div>

        {score === 100 && (
          <div style={{ fontSize: "0.92rem", lineHeight: 1.6, color: C?.text || "#D8CBB3" }}>
            🎉 <strong>Outstanding achievement!</strong> Your financial foundation is complete. With emergency savings
            in place and health coverage active, you are protected against life's most common financial disruptors.
            You can now allocate your surplus toward SIPs, retirement corpus, and high-growth investment strategies with confidence.
          </div>
        )}

        {score === 50 && emergencyFundCompleted && (
          <div style={{ fontSize: "0.92rem", lineHeight: 1.6, color: C?.text || "#D8CBB3" }}>
            <strong>Well done on securing your emergency reserve!</strong> Next priority: Protect those hard-earned savings
            by securing an independent health insurance policy. A single unexpected medical bill without cover can deplete
            your emergency fund in days.
          </div>
        )}

        {score === 50 && healthInsuranceCompleted && (
          <div style={{ fontSize: "0.92rem", lineHeight: 1.6, color: C?.text || "#D8CBB3" }}>
            <strong>Your health risks are protected!</strong> Next priority: Build a dedicated emergency fund covering at least
            3 months of essential expenses. Keep this fund liquid in a high-interest savings account or sweep-in fixed deposit.
          </div>
        )}

        {score === 0 && (
          <div style={{ fontSize: "0.92rem", lineHeight: 1.6, color: C?.text || "#D8CBB3" }}>
            <strong>Starting your financial journey:</strong> Focus on setting up a 1-month liquid emergency buffer first,
            then look into securing a basic individual health cover. These two steps give you the security needed before
            taking market risks.
          </div>
        )}
      </div>

      {/* Financial Rulebook Shortcut Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1))",
          border: `1px solid rgba(59, 130, 246, 0.3)`,
          borderRadius: "16px",
          padding: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              padding: "12px",
              borderRadius: "12px",
              background: "rgba(59, 130, 246, 0.2)",
              color: "#3B82F6",
            }}
          >
            <BookOpen size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 4px 0" }}>
              Explore the 28 Rules of Financial Wisdom
            </h3>
            <p style={{ margin: 0, fontSize: "0.88rem", color: C?.muted || "#9CA3AF" }}>
              Dive into the complete Financial Rulebook featuring interactive calculators for compounding, 50/30/20,
              safe withdrawal, retirement corpus, and more.
            </p>
          </div>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate("rulebook")}
            style={{
              padding: "12px 20px",
              borderRadius: "10px",
              background: "#3B82F6",
              border: "none",
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
            }}
          >
            Open Rulebook <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
