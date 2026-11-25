import { useState } from "react";
import { fmt } from "../shared";
import { updateBudgetCycle } from "../api";
import { Info, Settings, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";

export default function SafeToSpendCard({ C, currency, safeData, onRefresh }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [configForm, setConfigForm] = useState({
    cycleStartDay: 1,
    monthlySavingsGoal: "",
    minSafetyBuffer: "",
  });
  const [saving, setSaving] = useState(false);
  const [configError, setConfigError] = useState("");

  if (!safeData) {
    return (
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 24,
          animation: "pulse 1.5s infinite",
        }}
      >
        <div style={{ fontSize: 13, color: C.muted }}>Loading Safe-to-Spend engine...</div>
      </div>
    );
  }

  const {
    liquidBalance = 0,
    remainingObligations = 0,
    remainingSavingsGoal = 0,
    safetyBuffer = 0,
    monthSafeToSpend = 0,
    remainingDays = 1,
    dailySafeToSpend = 0,
    shortfall = 0,
    status = "ON_TRACK",
    cycle,
    breakdown,
  } = safeData;

  const openConfig = () => {
    setConfigForm({
      cycleStartDay: cycle?.cycleStartDay || 1,
      monthlySavingsGoal: breakdown?.savings?.goal || "",
      minSafetyBuffer: safetyBuffer || "",
    });
    setConfigError("");
    setShowConfig(true);
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    setConfigError("");
    try {
      await updateBudgetCycle({
        cycleStartDay: Number(configForm.cycleStartDay),
        monthlySavingsGoal: Number(configForm.monthlySavingsGoal || 0),
        minSafetyBuffer: Number(configForm.minSafetyBuffer || 0),
      });
      setShowConfig(false);
      onRefresh();
    } catch (err) {
      setConfigError(err.response?.data?.error || "Failed to update budget cycle");
    } finally {
      setSaving(false);
    }
  };

  const statusConfig = {
    ON_TRACK: {
      label: "On Track",
      color: C.green,
      bg: C.green + "22",
      icon: <CheckCircle size={14} />,
    },
    TIGHT: {
      label: "Tight Budget",
      color: C.gold,
      bg: C.gold + "22",
      icon: <AlertTriangle size={14} />,
    },
    SHORTFALL: {
      label: "Shortfall Warning",
      color: C.red,
      bg: C.red + "22",
      icon: <TrendingDown size={14} />,
    },
  }[status] || {
    label: "On Track",
    color: C.green,
    bg: C.green + "22",
    icon: <CheckCircle size={14} />,
  };

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${status === "SHORTFALL" ? C.red + "66" : C.border}`,
        borderRadius: 16,
        padding: "24px 28px",
        position: "relative",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: C.muted,
            }}
          >
            Safe to Spend Today
          </span>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: statusConfig.bg,
              color: statusConfig.color,
              padding: "3px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              border: `1px solid ${statusConfig.color}44`,
            }}
          >
            {statusConfig.icon}
            {statusConfig.label}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              background: showDetails ? C.gold + "22" : C.card,
              border: `1px solid ${C.border}`,
              color: showDetails ? C.gold : C.muted,
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "all 0.2s",
            }}
            title="View calculation breakdown"
          >
            <Info size={14} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>Breakdown</span>
          </button>

          <button
            onClick={openConfig}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              color: C.muted,
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "all 0.2s",
            }}
            title="Configure budget parameters"
          >
            <Settings size={14} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>Configure</span>
          </button>
        </div>
      </div>

      {/* Hero Numbers */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: "clamp(28px, 6vw, 44px)",
              fontWeight: 800,
              fontFamily: "monospace",
              color: status === "SHORTFALL" ? C.red : C.gold,
              lineHeight: 1.1,
              letterSpacing: "-1px",
            }}
          >
            {fmt(dailySafeToSpend, currency)}
            <span style={{ fontSize: 14, fontWeight: 500, color: C.muted, marginLeft: 6 }}>
              / day
            </span>
          </div>

          {shortfall > 0 && (
            <div style={{ fontSize: 12, color: C.red, marginTop: 4, fontWeight: 600 }}>
              ⚠ Projected Shortfall: {fmt(shortfall, currency)} this cycle
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase" }}>
              Monthly Available
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: C.text,
                fontFamily: "monospace",
              }}
            >
              {fmt(monthSafeToSpend, currency)}
            </div>
          </div>

          <div style={{ width: 1, height: 32, background: C.border }} />

          <div>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase" }}>
              Cycle Days Left
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: C.text,
                fontFamily: "monospace",
              }}
            >
              {remainingDays} <span style={{ fontSize: 12, color: C.muted }}>days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress / Status Bar */}
      <div
        style={{
          height: 6,
          background: C.border,
          borderRadius: 3,
          overflow: "hidden",
          marginBottom: showDetails ? 16 : 0,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(100, Math.max(5, (dailySafeToSpend / (monthSafeToSpend || 1)) * remainingDays * 100))}%`,
            background: status === "SHORTFALL" ? C.red : (status === "TIGHT" ? C.gold : C.green),
            borderRadius: 3,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* Transparent Breakdown Drawer */}
      {showDetails && (
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 16,
            marginTop: 14,
            fontSize: 12,
          }}
        >
          <div style={{ fontWeight: 700, color: C.text, marginBottom: 10 }}>
            How Safe-to-Spend is Calculated:
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.muted }}>+ Total Available Liquid Cash</span>
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: C.green }}>
                {fmt(liquidBalance, currency)}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.muted }}>
                - Unpaid Recurring Obligations ({breakdown?.obligations?.items?.filter(i => !i.isFullyPaid)?.length || 0} bills pending)
              </span>
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: C.red }}>
                - {fmt(remainingObligations, currency)}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.muted }}>
                - Unallocated Savings Target (Goal: {fmt(breakdown?.savings?.goal || 0, currency)})
              </span>
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: C.blue }}>
                - {fmt(remainingSavingsGoal, currency)}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.muted }}>- Minimum Safety Buffer (Emergency Cash)</span>
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: C.purple }}>
                - {fmt(safetyBuffer, currency)}
              </span>
            </div>

            <div
              style={{
                borderTop: `1px solid ${C.border}`,
                paddingTop: 8,
                marginTop: 4,
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 700,
              }}
            >
              <span style={{ color: C.text }}>= Safe for Rest of Month</span>
              <span
                style={{
                  fontFamily: "monospace",
                  color: monthSafeToSpend > 0 ? C.gold : C.red,
                }}
              >
                {fmt(monthSafeToSpend, currency)}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: C.muted,
                fontSize: 11,
              }}
            >
              <span>÷ {remainingDays} remaining cycle days</span>
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: C.text }}>
                = {fmt(dailySafeToSpend, currency)} / day
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfig && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              width: "100%",
              maxWidth: 420,
              padding: 24,
              boxShadow: "0 12px 36px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>
              Budget Cycle Configuration
            </div>

            {configError && (
              <div
                style={{
                  background: C.red + "22",
                  border: `1px solid ${C.red}44`,
                  color: C.red,
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  marginBottom: 12,
                }}
              >
                {configError}
              </div>
            )}

            <form onSubmit={handleSaveConfig} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>
                  Budget Cycle Start Day (1 - 31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={configForm.cycleStartDay}
                  onChange={(e) => setConfigForm({ ...configForm, cycleStartDay: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.card,
                    color: C.text,
                    fontSize: 14,
                  }}
                  required
                />
                <span style={{ fontSize: 11, color: C.muted, marginTop: 4, display: "block" }}>
                  e.g., Set to 1 for calendar month, or 25 for salary day.
                </span>
              </div>

              <div>
                <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>
                  Monthly Savings Goal (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 10000"
                  value={configForm.monthlySavingsGoal}
                  onChange={(e) => setConfigForm({ ...configForm, monthlySavingsGoal: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.card,
                    color: C.text,
                    fontSize: 14,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>
                  Minimum Safety Buffer (Emergency Cash ₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 5000"
                  value={configForm.minSafetyBuffer}
                  onChange={(e) => setConfigForm({ ...configForm, minSafetyBuffer: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.card,
                    color: C.text,
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: "transparent",
                    color: C.muted,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    border: "none",
                    background: C.accent || C.gold,
                    color: C.accentForeground || "#FFFFFF",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
