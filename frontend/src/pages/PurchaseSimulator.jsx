import { useState, useEffect } from "react";
import {
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Target,
  RefreshCw,
  Trash2,
  Sparkles,
  RotateCcw,
  CreditCard,
  Calendar,
  X,
  Check,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";

import {
  analyzeAffordability,
  savePurchaseSimulation,
  getSimulationHistory,
  deleteSimulation,
  convertSimulationToGoal,
  recalculateSimulation,
  getAffordabilityProfile,
} from "../api";
import { fmt, Spinner, ErrorBox } from "../shared";

export default function PurchaseSimulator({ C, currency = "INR" }) {
  // Payment Method Tab: "FULL_PAYMENT" | "EMI"
  const [activeTab, setActiveTab] = useState("FULL_PAYMENT");

  // Common Inputs
  const [productName, setProductName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [priority, setPriority] = useState("Optional");

  // Financial Baselines
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [essentialExpenses, setEssentialExpenses] = useState("");
  const [existingEMIs, setExistingEMIs] = useState("");
  const [plannedSavings, setPlannedSavings] = useState("");
  const [liquidBalance, setLiquidBalance] = useState("");
  const [otherUnpaidCommitments, setOtherUnpaidCommitments] = useState("");
  const [emergencyFundMonths, setEmergencyFundMonths] = useState(6);

  // EMI Specific Inputs
  const [downPayment, setDownPayment] = useState("");
  const [annualInterestRate, setAnnualInterestRate] = useState(0);
  const [tenureMonths, setTenureMonths] = useState(12);
  const [processingFees, setProcessingFees] = useState("");
  const [otherUpfrontCharges, setOtherUpfrontCharges] = useState("");

  // States
  const [simulating, setSimulating] = useState(false);
  const [simulation, setSimulation] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [syncingProfile, setSyncingProfile] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState("");
  const [error, setError] = useState(null);

  // Goal Modal State
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalMonths, setGoalMonths] = useState(6);
  const [goalMonthlyContrib, setGoalMonthlyContrib] = useState("");
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [goalSuccessMsg, setGoalSuccessMsg] = useState("");

  // 1. Initial Load: past simulations
  const loadInitialData = async () => {
    try {
      const histRes = await getSimulationHistory();
      if (histRes?.data?.history) {
        setHistory(histRes.data.history);
      }
    } catch (err) {
      console.error("Initial load error:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // 2. Fetch and populate user's live FinFlow profile
  const handleUseFinFlowData = async () => {
    setSyncingProfile(true);
    setError(null);
    setSyncSuccessMsg("");
    try {
      const res = await getAffordabilityProfile();
      const p = res?.data?.profile || res?.data?.data || {};

      setMonthlyIncome(p.monthlyIncome !== undefined ? String(p.monthlyIncome) : "");
      setEssentialExpenses(p.essentialExpenses !== undefined ? String(p.essentialExpenses) : "");
      setExistingEMIs(p.existingEMIs !== undefined ? String(p.existingEMIs) : "");
      setPlannedSavings(p.plannedSavings !== undefined ? String(p.plannedSavings) : "");
      setLiquidBalance(p.liquidBalance !== undefined ? String(p.liquidBalance) : "");
      setOtherUnpaidCommitments(p.otherUnpaidCommitments !== undefined ? String(p.otherUnpaidCommitments) : "");
      if (p.emergencyFundMonths) {
        setEmergencyFundMonths(p.emergencyFundMonths);
      }

      setSyncSuccessMsg("✓ FinFlow live financial data synced successfully!");
      setTimeout(() => setSyncSuccessMsg(""), 4000);
    } catch (err) {
      console.error("handleUseFinFlowData error:", err);
      setError(err?.response?.data?.error || err?.message || "Failed to load live FinFlow profile data.");
    } finally {
      setSyncingProfile(false);
    }
  };

  // 3. Reset form to default / empty
  const handleReset = () => {
    setProductName("");
    setAmount("");
    setCategory("Electronics");
    setPriority("Optional");
    setMonthlyIncome("");
    setEssentialExpenses("");
    setExistingEMIs("");
    setPlannedSavings("");
    setLiquidBalance("");
    setOtherUnpaidCommitments("");
    setEmergencyFundMonths(6);
    setDownPayment("");
    setAnnualInterestRate(0);
    setTenureMonths(12);
    setProcessingFees("");
    setOtherUpfrontCharges("");
    setSimulation(null);
    setError(null);
    setSyncSuccessMsg("");
  };

  // 4. Run Affordability Calculation
  const handleCalculate = async (e) => {
    if (e) e.preventDefault();

    if (!productName || !productName.trim()) {
      setError("Please enter a valid product or item name.");
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive purchase price.");
      return;
    }

    setSimulating(true);
    setError(null);
    setGoalSuccessMsg("");

    try {
      const payload = {
        productName: productName.trim(),
        amount: numAmount,
        category,
        priority,
        paymentMethod: activeTab,
        monthlyIncome: monthlyIncome !== "" ? Number(monthlyIncome) : undefined,
        essentialExpenses: essentialExpenses !== "" ? Number(essentialExpenses) : undefined,
        existingEMIs: existingEMIs !== "" ? Number(existingEMIs) : undefined,
        plannedSavings: plannedSavings !== "" ? Number(plannedSavings) : undefined,
        liquidBalance: liquidBalance !== "" ? Number(liquidBalance) : undefined,
        otherUnpaidCommitments: otherUnpaidCommitments !== "" ? Number(otherUnpaidCommitments) : undefined,
        emergencyFundMonths,
        downPayment: Number(downPayment) || 0,
        annualInterestRate: Number(annualInterestRate) || 0,
        tenureMonths: Number(tenureMonths) || 12,
        processingFees: Number(processingFees) || 0,
        otherUpfrontCharges: Number(otherUpfrontCharges) || 0,
        currency,
      };

      const res = await analyzeAffordability(payload);
      const result = res.data?.simulation || res.data?.data || null;
      setSimulation(result);

      // Auto-save to simulation history if successful
      if (result) {
        try {
          const saveRes = await savePurchaseSimulation(result);
          const saved = saveRes.data?.simulation;
          if (saved) {
            setSimulation(saved);
            setHistory((prev) => [saved, ...prev.filter((h) => h._id !== saved._id)]);
          }
        } catch {
          // Silent catch: calculation already succeeded
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to calculate purchase affordability.");
    } finally {
      setSimulating(false);
    }
  };

  // 5. Open Goal Modal
  const openGoalModal = (sim) => {
    const targetSim = sim || simulation;
    if (!targetSim) return;
    setGoalName(`Save for ${targetSim.productName}`);
    const gap = targetSim.totalFundingGap > 0 ? targetSim.totalFundingGap : targetSim.amount;
    setGoalTargetAmount(String(gap));
    const months = targetSim.monthsRequired && targetSim.monthsRequired > 0 ? targetSim.monthsRequired : 6;
    setGoalMonths(months);
    const monthlyAmt = Math.round(gap / Math.max(1, months));
    setGoalMonthlyContrib(String(monthlyAmt));
    setGoalModalOpen(true);
  };

  // 6. Confirm Goal Creation
  const handleConfirmCreateGoal = async () => {
    if (!simulation) return;
    setCreatingGoal(true);
    try {
      let simId = simulation._id;
      if (!simId) {
        const savedRes = await savePurchaseSimulation(simulation);
        simId = savedRes.data?.simulation?._id;
      }

      const res = await convertSimulationToGoal(simId, {
        name: goalName || `Save for ${simulation.productName}`,
        targetAmount: Number(goalTargetAmount) || simulation.amount,
        targetMonths: Number(goalMonths) || 6,
        monthlyContribution: Number(goalMonthlyContrib) || 0,
      });

      if (res.data?.success) {
        setGoalSuccessMsg("✓ Savings goal created successfully! You can track it on your dashboard.");
        setGoalModalOpen(false);
        setSimulation((prev) => (prev ? { ...prev, isConvertedToGoal: true } : prev));
        setHistory((prev) =>
          prev.map((item) => (item._id === simId ? { ...item, isConvertedToGoal: true } : item))
        );
      }
    } catch (err) {
      alert("Failed to create goal: " + (err.response?.data?.error || err.message));
    } finally {
      setCreatingGoal(false);
    }
  };

  // 7. Recalculate Historical Simulation
  const handleRecalculate = async (id) => {
    try {
      const res = await recalculateSimulation(id);
      const updated = res.data?.simulation;
      setSimulation(updated);
      setHistory((prev) => prev.map((item) => (item._id === id ? updated : item)));
    } catch (err) {
      alert("Failed to recalculate: " + (err.response?.data?.error || err.message));
    }
  };

  // 8. Delete Simulation
  const handleDeleteHistory = async (id) => {
    try {
      await deleteSimulation(id);
      setHistory((prev) => prev.filter((item) => item._id !== id));
      if (simulation && simulation._id === id) {
        setSimulation(null);
      }
    } catch (err) {
      alert("Failed to delete simulation: " + (err.response?.data?.error || err.message));
    }
  };

  // Status Badge Configuration
  const getStatusBadge = (status) => {
    switch (status) {
      case "COMFORTABLY_AFFORDABLE":
        return {
          label: "COMFORTABLY AFFORDABLE",
          color: C.green,
          bg: `${C.green}18`,
          border: `${C.green}44`,
          icon: <CheckCircle2 size={20} color={C.green} />,
        };
      case "AFFORDABLE":
        return {
          label: "AFFORDABLE",
          color: C.accent,
          bg: `${C.accent}18`,
          border: `${C.accent}44`,
          icon: <CheckCircle2 size={20} color={C.accent} />,
        };
      case "RISKY":
        return {
          label: "RISKY — PROCEED WITH CAUTION",
          color: C.warning,
          bg: `${C.warning}18`,
          border: `${C.warning}44`,
          icon: <AlertTriangle size={20} color={C.warning} />,
        };
      case "INSUFFICIENT_DATA":
        return {
          label: "INSUFFICIENT DATA",
          color: C.muted,
          bg: `${C.muted}18`,
          border: `${C.muted}44`,
          icon: <HelpCircle size={20} color={C.muted} />,
        };
      case "NOT_AFFORDABLE":
      default:
        return {
          label: "NOT AFFORDABLE RIGHT NOW",
          color: C.error,
          bg: `${C.error}18`,
          border: `${C.error}44`,
          icon: <XCircle size={20} color={C.error} />,
        };
    }
  };

  const statusConfig = simulation ? getStatusBadge(simulation.status || simulation.decision?.verdict) : null;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }}>
      {/* Header Banner */}
      <div
        style={{
          background: C.surface,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          padding: "24px 28px",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <ShoppingCart size={24} color={C.gold} />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>
              Can I Afford It? — Smart Purchase Simulator
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: C.muted }}>
            Fast, deterministic purchase affordability simulator based on your real cash flow, emergency reserves, and debts.
          </p>
        </div>

        {/* Action Pills */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={handleUseFinFlowData}
            disabled={syncingProfile}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 16px",
              borderRadius: 10,
              background: `${C.gold}22`,
              color: C.gold,
              border: `1px solid ${C.gold}66`,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {syncingProfile ? <Spinner size={14} color={C.gold} /> : <Sparkles size={14} />}
            Use My FinFlow Data
          </button>

          <button
            onClick={handleReset}
            title="Reset all inputs"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 14px",
              borderRadius: 10,
              background: C.card,
              color: C.muted,
              border: `1px solid ${C.border}`,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      {syncSuccessMsg && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: 10,
            background: "#10B98118",
            border: "1px solid #10B98144",
            color: C.green,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          {syncSuccessMsg}
        </div>
      )}

      {error && <ErrorBox message={error} />}

      {/* Main Grid: Input Form (Left) & Simulator Results (Right) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
          gap: 24,
          marginBottom: 32,
        }}
      >
        {/* INPUT FORM CONTAINER */}
        <div
          style={{
            background: C.surface,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            padding: "24px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>
              Simulate a Planned Purchase
            </h2>
          </div>

          {/* TWO PAYMENT TABS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              padding: 4,
              borderRadius: 12,
              background: C.card,
              border: `1px solid ${C.border}`,
              marginBottom: 20,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("FULL_PAYMENT")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 8,
                border: "none",
                background: activeTab === "FULL_PAYMENT" ? C.surface : "transparent",
                color: activeTab === "FULL_PAYMENT" ? C.gold : C.muted,
                fontWeight: activeTab === "FULL_PAYMENT" ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: activeTab === "FULL_PAYMENT" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              <CreditCard size={16} />
              Full Payment
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("EMI")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 8,
                border: "none",
                background: activeTab === "EMI" ? C.surface : "transparent",
                color: activeTab === "EMI" ? C.gold : C.muted,
                fontWeight: activeTab === "EMI" ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: activeTab === "EMI" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              <Calendar size={16} />
              EMI Payment
            </button>
          </div>

          <form onSubmit={handleCalculate}>
            {/* Product Details Section */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6 }}>
                Product or Purchase Item
              </label>
              <input
                type="text"
                placeholder="e.g. Apple MacBook Pro, Two-Wheeler, Course"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: C.card,
                  color: C.text,
                  border: `1px solid ${C.border}`,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6 }}>
                  Purchase Price ({currency})
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="1"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: C.card,
                    color: C.text,
                    border: `1px solid ${C.border}`,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6 }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: C.card,
                    color: C.text,
                    border: `1px solid ${C.border}`,
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                >
                  {["Electronics", "Lifestyle", "Fashion", "Travel", "Home", "Vehicle", "Education", "Other"].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Financial Baselines Header */}
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.gold,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                margin: "18px 0 10px 0",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ShieldCheck size={14} />
              Financial Baselines & Reserves
            </div>

            {/* Monthly Income & Essential Expenses */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
                  Monthly Take-Home Income ({currency})
                </label>
                <input
                  type="number"
                  placeholder="e.g. 80000"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    background: C.card,
                    color: C.text,
                    border: `1px solid ${C.border}`,
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
                  Monthly Essential Needs ({currency})
                </label>
                <input
                  type="number"
                  placeholder="e.g. 30000"
                  value={essentialExpenses}
                  onChange={(e) => setEssentialExpenses(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    background: C.card,
                    color: C.text,
                    border: `1px solid ${C.border}`,
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Existing EMIs & Planned Savings */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
                  Existing Monthly EMIs ({currency})
                </label>
                <input
                  type="number"
                  placeholder="e.g. 10000"
                  value={existingEMIs}
                  onChange={(e) => setExistingEMIs(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    background: C.card,
                    color: C.text,
                    border: `1px solid ${C.border}`,
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
                  Planned Monthly Savings ({currency})
                </label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={plannedSavings}
                  onChange={(e) => setPlannedSavings(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    background: C.card,
                    color: C.text,
                    border: `1px solid ${C.border}`,
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Liquid Balance & Other Unpaid Commitments */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
                  Liquid Bank Balance ({currency})
                </label>
                <input
                  type="number"
                  placeholder="e.g. 250000"
                  value={liquidBalance}
                  onChange={(e) => setLiquidBalance(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    background: C.card,
                    color: C.text,
                    border: `1px solid ${C.border}`,
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
                  Other Unpaid Commitments ({currency})
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={otherUnpaidCommitments}
                  onChange={(e) => setOtherUnpaidCommitments(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    background: C.card,
                    color: C.text,
                    border: `1px solid ${C.border}`,
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Emergency Fund Target (3m vs 6m) */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 6 }}>
                Emergency Fund Reserve Target
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setEmergencyFundMonths(3)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: `1px solid ${emergencyFundMonths === 3 ? C.gold : C.border}`,
                    background: emergencyFundMonths === 3 ? `${C.gold}20` : C.card,
                    color: emergencyFundMonths === 3 ? C.gold : C.muted,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  3 Months (Basic)
                </button>
                <button
                  type="button"
                  onClick={() => setEmergencyFundMonths(6)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: `1px solid ${emergencyFundMonths === 6 ? C.gold : C.border}`,
                    background: emergencyFundMonths === 6 ? `${C.gold}20` : C.card,
                    color: emergencyFundMonths === 6 ? C.gold : C.muted,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  6 Months (Recommended)
                </button>
              </div>
            </div>

            {/* EMI SPECIFIC INPUTS (When EMI Tab is selected) */}
            {activeTab === "EMI" && (
              <div
                style={{
                  background: C.card,
                  borderRadius: 12,
                  padding: 16,
                  border: `1px solid ${C.border}`,
                  marginBottom: 18,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 12 }}>
                  Loan Financing & EMI Terms
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 4 }}>
                      Down Payment ({currency})
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        background: C.surface,
                        color: C.text,
                        border: `1px solid ${C.border}`,
                        fontSize: 13,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 4 }}>
                      Loan Tenure (Months)
                    </label>
                    <select
                      value={tenureMonths}
                      onChange={(e) => setTenureMonths(Number(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        background: C.surface,
                        color: C.text,
                        border: `1px solid ${C.border}`,
                        fontSize: 13,
                        boxSizing: "border-box",
                      }}
                    >
                      {[3, 6, 9, 12, 18, 24, 36, 48, 60].map((m) => (
                        <option key={m} value={m}>
                          {m} Months
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 4 }}>
                      Annual Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      placeholder="0 (No-cost)"
                      value={annualInterestRate}
                      onChange={(e) => setAnnualInterestRate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        background: C.surface,
                        color: C.text,
                        border: `1px solid ${C.border}`,
                        fontSize: 13,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 4 }}>
                      Processing Fees ({currency})
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={processingFees}
                      onChange={(e) => setProcessingFees(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        background: C.surface,
                        color: C.text,
                        border: `1px solid ${C.border}`,
                        fontSize: 13,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 4 }}>
                    Other Upfront Charges ({currency})
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={otherUpfrontCharges}
                    onChange={(e) => setOtherUpfrontCharges(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      background: C.surface,
                      color: C.text,
                      border: `1px solid ${C.border}`,
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Calculate Button */}
            <button
              type="submit"
              disabled={simulating}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                background: C.gold,
                color: "#FFFFFF",
                border: "none",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: C.shadowSm,
              }}
            >
              {simulating ? <Spinner size={16} color="#FFFFFF" /> : <Sparkles size={16} />}
              {simulating ? "Analyzing Financial Capacity..." : "Check If I Can Afford It"}
            </button>
          </form>
        </div>

        {/* RESULTS CARD (Right Column) */}
        <div
          style={{
            background: C.surface,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: simulation ? "flex-start" : "center",
            minHeight: 480,
          }}
        >
          {!simulation ? (
            <div style={{ textAlign: "center", color: C.muted, padding: "40px 20px" }}>
              <ShoppingCart size={48} color={C.border} style={{ marginBottom: 16 }} />
              <h3 style={{ margin: "0 0 8px 0", fontSize: 16, color: C.text, fontWeight: 700 }}>
                No Simulation Active
              </h3>
              <p style={{ margin: 0, fontSize: 13, maxWidth: 320, lineHeight: 1.5, marginInline: "auto" }}>
                Enter product details on the left and submit or use your FinFlow profile to evaluate affordability.
              </p>
            </div>
          ) : (
            <div>
              {/* Canonical Status Banner */}
              <div
                style={{
                  padding: "18px 20px",
                  borderRadius: 14,
                  background: statusConfig.bg,
                  border: `1px solid ${statusConfig.border}`,
                  marginBottom: 20,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  {statusConfig.icon}
                  <span style={{ fontSize: 16, fontWeight: 800, color: statusConfig.color }}>
                    {statusConfig.label}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5, fontWeight: 500 }}>
                  {simulation.recommendation || simulation.decision?.explanation}
                </div>
              </div>

              {/* 4 Core Financial Summary Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                <div
                  style={{
                    padding: "12px",
                    borderRadius: 10,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
                    Monthly Disposable Income
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: simulation.monthlyDisposableIncome >= 0 ? C.green : C.red,
                    }}
                  >
                    {fmt(simulation.monthlyDisposableIncome, currency)}
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px",
                    borderRadius: 10,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
                    {simulation.emergencyFundMonths}-Mo Emergency Reserve
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                    {fmt(simulation.requiredEmergencyFund, currency)}
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px",
                    borderRadius: 10,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
                    Available Spending Balance
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.gold }}>
                    {fmt(simulation.availableSpendingBalance, currency)}
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px",
                    borderRadius: 10,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
                    {simulation.paymentMethod === "EMI" ? "EMI Affordability Ratio" : "Purchase / Available Ratio"}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color:
                        (simulation.paymentMethod === "EMI" ? simulation.emiAffordabilityRatio : simulation.affordabilityRatio) <= 30
                          ? C.green
                          : (simulation.paymentMethod === "EMI" ? simulation.emiAffordabilityRatio : simulation.affordabilityRatio) <= 50
                          ? C.gold
                          : C.red,
                    }}
                  >
                    {simulation.paymentMethod === "EMI" ? simulation.emiAffordabilityRatio : simulation.affordabilityRatio}%
                  </div>
                </div>
              </div>

              {/* Before vs After Projections */}
              <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 700, color: C.text }}>
                Financial Position (Before vs After)
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {[
                  {
                    label: "Liquid Bank Balance",
                    before: fmt(simulation.liquidBalance, currency),
                    after: fmt(simulation.postPurchaseBankBalance, currency),
                    safe: simulation.postPurchaseBankBalance >= simulation.requiredEmergencyFund,
                  },
                  {
                    label: "Unreserved Spending Balance",
                    before: fmt(simulation.availableSpendingBalance, currency),
                    after: fmt(simulation.postPurchaseUnreservedBalance, currency),
                    safe: simulation.postPurchaseUnreservedBalance > 0,
                  },
                  {
                    label: "Monthly Disposable Income",
                    before: fmt(simulation.monthlyDisposableIncome, currency),
                    after: fmt(simulation.postPurchaseMonthlyDisposableIncome, currency),
                    safe: simulation.postPurchaseMonthlyDisposableIncome >= 0,
                  },
                  {
                    label: "Monthly Debt / EMIs",
                    before: fmt(simulation.existingEMIs, currency),
                    after: fmt(simulation.postPurchaseMonthlyEMIs, currency),
                    safe: simulation.debtToIncomeRatio <= 30,
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: C.card,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                      <span style={{ color: C.muted }}>{item.before}</span>
                      <ArrowRight size={12} color={C.muted} />
                      <span style={{ fontWeight: 700, color: item.safe ? C.green : C.red }}>
                        {item.after}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* EMI Financing Breakdown (if EMI) */}
              {simulation.paymentMethod === "EMI" && simulation.emiDetails?.monthlyEMI > 0 && (
                <div
                  style={{
                    padding: "14px",
                    borderRadius: 12,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 8 }}>
                    EMI Financing Breakdown
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                    <div>
                      <span style={{ color: C.muted }}>Monthly Installment: </span>
                      <strong style={{ color: C.text }}>{fmt(simulation.emiDetails.monthlyEMI, currency)}/mo</strong>
                    </div>
                    <div>
                      <span style={{ color: C.muted }}>Tenure: </span>
                      <strong style={{ color: C.text }}>{simulation.emiDetails.tenureMonths} Months</strong>
                    </div>
                    <div>
                      <span style={{ color: C.muted }}>Total Interest: </span>
                      <strong style={{ color: simulation.emiDetails.totalInterest > 0 ? C.red : C.green }}>
                        {fmt(simulation.emiDetails.totalInterest, currency)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: C.muted }}>Total Purchase Cost: </span>
                      <strong style={{ color: C.text }}>{fmt(simulation.emiDetails.totalCost, currency)}</strong>
                    </div>
                    <div>
                      <span style={{ color: C.muted }}>Debt-to-Income: </span>
                      <strong style={{ color: simulation.debtToIncomeRatio > 30 ? C.red : C.green }}>
                        {simulation.debtToIncomeRatio}%
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Specific Numerical Reasons */}
              {simulation.reasons && simulation.reasons.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 700, color: C.text }}>
                    Key Financial Factors Considered
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {simulation.reasons.map((reason, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: 12,
                          color: C.muted,
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          lineHeight: 1.4,
                        }}
                      >
                        <span style={{ color: C.gold, fontWeight: 700, marginTop: 1 }}>•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Savings Timeline & Goal Section */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: 12,
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  marginBottom: 20,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                  How Long Until I Can Afford It?
                </div>
                {simulation.totalFundingGap > 0 ? (
                  <p style={{ margin: "0 0 12px 0", fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                    You currently have a funding gap of <strong>{fmt(simulation.totalFundingGap, currency)}</strong>.
                    {simulation.monthsRequired !== null ? (
                      <>
                        {" "}Saving at your current disposable income, you can purchase this in{" "}
                        <strong style={{ color: C.gold }}>{simulation.monthsRequired} month(s)</strong> without debt stress.
                      </>
                    ) : (
                      <>
                        {" "}You are currently running a monthly cash flow deficit. Prioritize balancing income and essentials before planning this purchase.
                      </>
                    )}
                  </p>
                ) : (
                  <p style={{ margin: "0 0 12px 0", fontSize: 12, color: C.green }}>
                    ✓ You already have sufficient unreserved funds to make this purchase without any funding gap!
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => openGoalModal()}
                  disabled={simulation.isConvertedToGoal}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 8,
                    background: simulation.isConvertedToGoal ? `${C.green}22` : C.gold,
                    color: simulation.isConvertedToGoal ? C.green : "#FFFFFF",
                    border: simulation.isConvertedToGoal ? `1px solid ${C.green}44` : "none",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: simulation.isConvertedToGoal ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Target size={14} />
                  {simulation.isConvertedToGoal ? "Savings Goal Created!" : "Create Savings Goal for This Purchase"}
                </button>
              </div>

              {goalSuccessMsg && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "#10B98118",
                    border: "1px solid #10B98144",
                    color: C.green,
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 16,
                  }}
                >
                  {goalSuccessMsg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SIMULATION HISTORY SECTION */}
      <div
        style={{
          background: C.surface,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          padding: "24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>
            Past Simulation History
          </h3>
          <span style={{ fontSize: 12, color: C.muted }}>{history.length} saved</span>
        </div>

        {loadingHistory ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Spinner C={C} />
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: "center", color: C.muted, padding: "24px 0", fontSize: 13 }}>
            No previous simulations saved yet. Calculate a purchase above to start tracking.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {history.map((item) => {
              const b = getStatusBadge(item.status || item.decision?.verdict);
              return (
                <div
                  key={item._id}
                  style={{
                    padding: "16px",
                    borderRadius: 12,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                        {item.productName}
                      </div>
                      <div style={{ fontSize: 12, color: C.gold, fontWeight: 700 }}>
                        {fmt(item.amount, currency)} ({item.paymentMethod === "EMI" ? "EMI" : "Full Payment"})
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: b.bg,
                        color: b.color,
                        border: `1px solid ${b.border}`,
                      }}
                    >
                      {b.label}
                    </span>
                  </div>

                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
                    {new Date(item.createdAt).toLocaleDateString()} • {item.category}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button
                      onClick={() => handleRecalculate(item._id)}
                      title="Recalculate with fresh financial data"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "5px 10px",
                        borderRadius: 6,
                        background: C.surface,
                        color: C.text,
                        border: `1px solid ${C.border}`,
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      <RefreshCw size={12} />
                      Recalculate
                    </button>

                    <button
                      onClick={() => handleDeleteHistory(item._id)}
                      title="Delete simulation"
                      style={{
                        background: "none",
                        border: "none",
                        color: C.muted,
                        cursor: "pointer",
                        padding: 4,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE SAVINGS GOAL CONFIRMATION MODAL */}
      {goalModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: C.surface,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              padding: 24,
              maxWidth: 420,
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>
                Confirm Savings Goal
              </h3>
              <button
                onClick={() => setGoalModalOpen(false)}
                style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: "0 0 16px 0", fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
              Convert this purchase plan into an active automated savings goal to track your monthly progress.
            </p>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
                Goal Name
              </label>
              <input
                type="text"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: C.card,
                  color: C.text,
                  border: `1px solid ${C.border}`,
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
                  Target Amount ({currency})
                </label>
                <input
                  type="number"
                  value={goalTargetAmount}
                  onChange={(e) => setGoalTargetAmount(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    background: C.card,
                    color: C.text,
                    border: `1px solid ${C.border}`,
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
                  Target Months
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={goalMonths}
                  onChange={(e) => {
                    const m = Number(e.target.value) || 1;
                    setGoalMonths(m);
                    if (Number(goalTargetAmount) > 0) {
                      setGoalMonthlyContrib(String(Math.round(Number(goalTargetAmount) / m)));
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    background: C.card,
                    color: C.text,
                    border: `1px solid ${C.border}`,
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
                Monthly Contribution ({currency})
              </label>
              <input
                type="number"
                value={goalMonthlyContrib}
                onChange={(e) => setGoalMonthlyContrib(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: C.card,
                  color: C.text,
                  border: `1px solid ${C.border}`,
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setGoalModalOpen(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 8,
                  background: C.card,
                  color: C.text,
                  border: `1px solid ${C.border}`,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmCreateGoal}
                disabled={creatingGoal}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 8,
                  background: C.gold,
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {creatingGoal ? <Spinner size={14} color="#FFFFFF" /> : <Check size={14} />}
                Confirm Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
