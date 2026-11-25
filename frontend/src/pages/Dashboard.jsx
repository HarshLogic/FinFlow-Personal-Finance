import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  getSummary,
  getExpenseAnalytics,
  getSafeToSpend,
  getAccounts,
  getSplits,
  getSplitsSummary,
  getMonthlyReportsHistory,
  getSimulationHistory,
  getFinancialFoundation,
} from "../api";
import {
  fmt,
  pct,
  SectionTitle,
  Spinner,
  ErrorBox,
} from "../shared";

import SafeToSpendCard from "../components/SafeToSpendCard";
import ObligationsWidget from "../components/ObligationsWidget";
import WhoOwesMeWidget from "../components/WhoOwesMeWidget";
import QuickPasteModal from "../components/QuickPasteModal";
import AccountsWidget from "../components/AccountsWidget";
import {
  Sparkles,
  FileText,
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  PlusCircle,
  TrendingUp,
  Wallet,
} from "lucide-react";

export default function Dashboard({ C, currency, setPage }) {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [safeData, setSafeData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [splits, setSplits] = useState([]);
  const [splitsSummary, setSplitsSummary] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [latestSimulation, setLatestSimulation] = useState(null);
  const [foundation, setFoundation] = useState(null);

  const [isQuickPasteOpen, setIsQuickPasteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // =====================================================
  // LOAD DASHBOARD DATA
  // =====================================================
  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        summaryRes,
        analyticsRes,
        safeRes,
        accountsRes,
        splitsRes,
        splitsSummaryRes,
        reportsRes,
        simulationsRes,
        foundationRes,
      ] = await Promise.allSettled([
        getSummary(),
        getExpenseAnalytics(),
        getSafeToSpend(),
        getAccounts(),
        getSplits(),
        getSplitsSummary(),
        getMonthlyReportsHistory(),
        getSimulationHistory(),
        getFinancialFoundation(),
      ]);

      if (summaryRes.status === "fulfilled") {
        setSummary(summaryRes.value.data);
      } else {
        console.error("Summary error:", summaryRes.reason);
      }

      if (analyticsRes.status === "fulfilled") {
        setAnalytics(analyticsRes.value.data || []);
      }

      if (safeRes.status === "fulfilled") {
        setSafeData(safeRes.value.data?.data || null);
      } else {
        console.error("Safe-to-Spend error:", safeRes.reason);
      }

      if (accountsRes.status === "fulfilled") {
        setAccounts(accountsRes.value.data || []);
      }

      if (splitsRes.status === "fulfilled") {
        setSplits(splitsRes.value.data || []);
      }

      if (splitsSummaryRes.status === "fulfilled") {
        setSplitsSummary(splitsSummaryRes.value.data || null);
      }

      if (reportsRes.status === "fulfilled" && reportsRes.value.data?.history?.length > 0) {
        setLatestReport(reportsRes.value.data.history[0]);
      }

      if (simulationsRes.status === "fulfilled" && simulationsRes.value.data?.history?.length > 0) {
        setLatestSimulation(simulationsRes.value.data.history[0]);
      }

      if (foundationRes.status === "fulfilled" && foundationRes.value.data?.data) {
        setFoundation(foundationRes.value.data.data);
      }
    } catch (e) {
      console.error("Dashboard error:", e);
      setError(e.response?.data?.error || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // =====================================================
  // MONTHLY EXPENSE FLOW
  // =====================================================
  const monthNames = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const flowMap = {};

  analytics.forEach(({ _id, total }) => {
    if (!_id) return;

    const key = `${_id.year}-${String(_id.month).padStart(2, "0")}`;

    if (!flowMap[key]) {
      flowMap[key] = {
        month: monthNames[_id.month],
        need: 0,
        want: 0,
      };
    }

    if (_id.type === "need") {
      flowMap[key].need += Number(total || 0);
    }

    if (_id.type === "want") {
      flowMap[key].want += Number(total || 0);
    }
  });

  const flowData = Object.values(flowMap)
    .slice(-6)
    .map((d) => ({
      month: d.month,
      expense: d.need + d.want,
      need: d.need,
      want: d.want,
    }));

  // =====================================================
  // LOADING / ERROR
  // =====================================================
  if (loading) {
    return <Spinner C={C} />;
  }

  if (error && !summary) {
    return <ErrorBox C={C} message={error} onRetry={load} />;
  }

  if (!summary) {
    return null;
  }

  // =====================================================
  // GET SUMMARY DATA
  // =====================================================
  const { summary: s, expenses } = summary;

  const needSpend = Number(expenses?.needSpend || 0);
  const wantSpend = Number(expenses?.wantSpend || 0);
  const totalMonthlySpend = needSpend + wantSpend;

  const { allocation = {} } = s || {};
  const liquidVal = allocation?.liquid?.value ?? 0;
  const stockVal = allocation?.stocks?.value ?? 0;
  const mfVal = allocation?.mutualFunds?.value ?? 0;
  const fdVal = allocation?.fixedDeposits?.value ?? 0;

  // =====================================================
  // ASSET ALLOCATION DATA
  // =====================================================
  const allocationData = [
    {
      name: "Liquid",
      value: Math.round(liquidVal / 1000),
      fill: C.blue,
    },
    {
      name: "Stocks",
      value: Math.round(stockVal / 1000),
      fill: C.accent,
    },
    {
      name: "Mutual Funds",
      value: Math.round(mfVal / 1000),
      fill: C.purple,
    },
    {
      name: "Fixed Deposits",
      value: Math.round(fdVal / 1000),
      fill: C.green,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        width: "100%",
        maxWidth: 1400,
        margin: "0 auto",
      }}
    >
      {/* ── TOP ACTION BAR: CONTEXT & QUICK ADD ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: C.accent,
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>
            Real-Time Financial Operating System & Wealth Tracker
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setPage && setPage("expenses")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.card,
              color: C.text,
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <PlusCircle size={15} />
            <span>Add Transaction</span>
          </button>

          <button
            onClick={() => setIsQuickPasteOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: C.accent,
              color: C.accentForeground || "#FFFFFF",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
              transition: "all 0.15s ease",
            }}
          >
            <Sparkles size={15} />
            <span>Quick Add via SMS</span>
          </button>
        </div>
      </div>

      {/* ── BENTO GRID SECTION 1: PRIMARY FINANCIAL CORE ── */}
      <div className="bento-container">
        {/* HERO CARD: TOTAL NET WORTH & WEALTH OVERVIEW (Span 7) */}
        <div
          className="bento-col-7"
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: C.muted,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Wallet size={14} color={C.accent} />
                <span>Total Net Worth</span>
              </div>

              {s.totalPL !== undefined && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    borderRadius: 20,
                    background: `${s.totalPL >= 0 ? C.green : C.red}18`,
                    color: s.totalPL >= 0 ? C.green : C.red,
                    border: `1px solid ${s.totalPL >= 0 ? C.green : C.red}33`,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <TrendingUp size={13} />
                  <span>
                    {s.totalPL >= 0 ? "+" : ""}
                    {fmt(s.totalPL, currency)}
                  </span>
                </div>
              )}
            </div>

            <div
              style={{
                fontSize: "clamp(30px, 4vw, 42px)",
                fontWeight: 800,
                color: C.text,
                letterSpacing: "-0.03em",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1.1,
                marginBottom: 20,
              }}
            >
              {fmt(s.totalWealth, currency)}
            </div>
          </div>

          {/* Sub-Metrics Ribbon */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 12,
              paddingTop: 16,
              borderTop: `1px solid ${C.border}`,
            }}
          >
            <div style={{ background: C.card, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Liquid Balance</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.blue, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                {fmt(liquidVal, currency)}
              </div>
            </div>

            <div style={{ background: C.card, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Total Invested</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.accent, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                {fmt(s.totalInvested, currency)}
              </div>
            </div>

            <div style={{ background: C.card, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Monthly Spend</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                {fmt(totalMonthlySpend, currency)}
              </div>
            </div>
          </div>
        </div>

        {/* HERO CARD: SAFE TO SPEND TODAY (Span 5) */}
        <div className="bento-col-5" style={{ display: "flex", flexDirection: "column" }}>
          <SafeToSpendCard
            C={C}
            currency={currency}
            safeData={safeData}
            onRefresh={load}
          />
        </div>
      </div>

      {/* ── BENTO GRID SECTION 2: FINANCIAL INTELLIGENCE & SCORES ── */}
      <div className="bento-container">
        {/* CARD 1: CAN I AFFORD IT? SIMULATOR (Span 4) */}
        <div
          className="bento-col-4"
          style={{
            background: C.surface,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ padding: 8, borderRadius: 8, background: `${C.blue}18`, color: C.blue }}>
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>
                    Can I Afford It?
                  </h3>
                  <div style={{ fontSize: 11, color: C.muted }}>Purchase Simulator</div>
                </div>
              </div>

              <div
                style={{
                  padding: "3px 9px",
                  borderRadius: 12,
                  background: `${C.green}18`,
                  color: C.green,
                  border: `1px solid ${C.green}33`,
                  fontSize: 11,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                Safe: {fmt(safeData?.monthSafeToSpend || 0, currency)}
              </div>
            </div>

            {latestSimulation ? (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                    {latestSimulation.productName} ({fmt(latestSimulation.amount, currency)})
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 6,
                      background: `${latestSimulation.decision?.color || C.accent}18`,
                      color: latestSimulation.decision?.color || C.accent,
                      border: `1px solid ${latestSimulation.decision?.color || C.accent}33`,
                    }}
                  >
                    {latestSimulation.decision?.verdictLabel || latestSimulation.decision?.verdict}
                  </span>
                </div>
              </div>
            ) : (
              <p style={{ margin: "0 0 12px 0", fontSize: 12, color: C.muted, lineHeight: 1.4 }}>
                Simulate planned purchases against your available liquid cash without risking bills or reserves.
              </p>
            )}

            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4, marginBottom: 16 }}>
              Available capacity: <strong style={{ color: C.text }}>{fmt(safeData?.monthSafeToSpend || 0, currency)}</strong> uncommitted liquid cash.
            </div>
          </div>

          <button
            onClick={() => setPage && setPage("affordability")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "9px 16px",
              borderRadius: 8,
              background: C.card,
              color: C.text,
              border: `1px solid ${C.border}`,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <span>Check Affordability</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* CARD 2: MONTHLY CA REPORT (Span 4) */}
        <div
          className="bento-col-4"
          style={{
            background: C.surface,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ padding: 8, borderRadius: 8, background: `${C.accent}18`, color: C.accent }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>
                    Personal CA Report
                  </h3>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {latestReport ? latestReport.reportingPeriod?.label || `${latestReport.month}/${latestReport.year}` : "Current Cycle"}
                    {latestReport?.isProvisional && " • Provisional"}
                  </div>
                </div>
              </div>

              {latestReport?.healthScore && (
                <div
                  style={{
                    padding: "3px 9px",
                    borderRadius: 12,
                    background: `${latestReport.healthScore.color || C.green}18`,
                    color: latestReport.healthScore.color || C.green,
                    border: `1px solid ${latestReport.healthScore.color || C.green}33`,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  Score: {latestReport.healthScore.score}/100
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div style={{ background: C.card, padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.muted }}>Savings Rate</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.accent, fontVariantNumeric: "tabular-nums" }}>
                  {latestReport ? `${(latestReport.financialSummary?.savingsRate || 0).toFixed(1)}%` : "20.0% Target"}
                </div>
              </div>
              <div style={{ background: C.card, padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.muted }}>Assessment</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                  {latestReport?.healthScore?.rating || "Audit Ready"}
                </div>
              </div>
            </div>

            <p style={{ margin: "0 0 16px 0", fontSize: 11, color: C.muted, lineHeight: 1.4 }}>
              Comprehensive monthly audit of fixed obligations, discretionary splits, and personal tax advisory.
            </p>
          </div>

          <button
            onClick={() => setPage && setPage("ca-report")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "9px 16px",
              borderRadius: 8,
              background: C.card,
              color: C.text,
              border: `1px solid ${C.border}`,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <span>View Full CA Report</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* CARD 3: FINANCIAL FOUNDATION SCORE (Span 4) */}
        <div
          className="bento-col-4"
          style={{
            background: C.surface,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ padding: 8, borderRadius: 8, background: `${C.green}18`, color: C.green }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>
                    Financial Foundation
                  </h3>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {foundation?.classification || "Protection Checklist"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "3px 9px",
                  borderRadius: 12,
                  background: (foundation?.score === 100 ? C.green : foundation?.score === 50 ? C.blue : C.warning) + "18",
                  color: foundation?.score === 100 ? C.green : foundation?.score === 50 ? C.blue : C.warning,
                  border: `1px solid ${(foundation?.score === 100 ? C.green : foundation?.score === 50 ? C.blue : C.warning)}33`,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                Score: {foundation?.score || 0}/100
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div style={{ background: C.card, padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.muted }}>Emergency Fund</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: foundation?.milestones?.emergencyFund?.completed ? C.green : C.muted, marginTop: 2 }}>
                  {foundation?.milestones?.emergencyFund?.completed ? "✓ Protected" : "○ Not Set"}
                </div>
              </div>
              <div style={{ background: C.card, padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.muted }}>Health Insurance</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: foundation?.milestones?.healthInsurance?.completed ? C.blue : C.muted, marginTop: 2 }}>
                  {foundation?.milestones?.healthInsurance?.completed ? "✓ Covered" : "○ Not Set"}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ width: "100%", height: 6, background: C.border, borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
              <div
                style={{
                  width: `${foundation?.score || 0}%`,
                  height: "100%",
                  background: foundation?.score === 100 ? C.green : foundation?.score === 50 ? C.blue : C.warning,
                  borderRadius: 3,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>

          <button
            onClick={() => setPage && setPage("milestones")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "9px 16px",
              borderRadius: 8,
              background: C.card,
              color: C.text,
              border: `1px solid ${C.border}`,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <span>View Milestones</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* ── BENTO GRID SECTION 3: RULEBOOK HIGHLIGHT (Span 12) ── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.surface}, ${C.card})`,
          borderRadius: 14,
          border: `1px solid ${C.border}`,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ padding: 8, borderRadius: 8, background: `${C.accent}18`, color: C.accent }}>
            <BookOpen size={18} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
              Financial Rulebook — 28 Golden Principles & Interactive Calculators
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>
              Morgan Housel insights • Compounding, 50/30/20, Rule of 72, 4% Safe Withdrawal Rule
            </div>
          </div>
        </div>

        <button
          onClick={() => setPage && setPage("rulebook")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            background: C.accent,
            border: "none",
            color: C.accentForeground || "#FFFFFF",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <span>Explore Rulebook</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* ── BENTO GRID SECTION 4: ANALYTICS & ALLOCATION ── */}
      <div className="bento-container">
        {/* MONTHLY EXPENSE FLOW CHART (Span 7) */}
        <div
          className="bento-col-7"
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <SectionTitle C={C}>Monthly Expense Flow</SectionTitle>

          {flowData.length === 0 ? (
            <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "40px 0" }}>
              No expense data yet — add transactions to unlock cash flow charts.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={flowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gNeed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.green} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gWant" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.accent} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: C.muted, fontSize: 11 }}
                  axisLine={{ stroke: C.border }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => fmt(v, currency)}
                  tick={{ fill: C.muted, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => fmt(value, currency)}
                  contentStyle={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    color: C.text,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="need"
                  stroke={C.green}
                  fill="url(#gNeed)"
                  strokeWidth={2}
                  name="Needs"
                />
                <Area
                  type="monotone"
                  dataKey="want"
                  stroke={C.accent}
                  fill="url(#gWant)"
                  strokeWidth={2}
                  name="Wants"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ASSET ALLOCATION & 50-30-20 RULE (Span 5) */}
        <div
          className="bento-col-5"
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <SectionTitle C={C}>Asset Allocation & Balance</SectionTitle>

          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie
                  data={allocationData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={54}
                  paddingAngle={3}
                >
                  {allocationData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              {allocationData.map((d) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.fill }} />
                  <span style={{ fontSize: 11, color: C.muted, flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>
                    {d.value}k
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 50-30-20 Breakdown */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11 }}>
              <span style={{ color: C.muted }}>Discretionary Spend Split</span>
              <span style={{ fontWeight: 600, color: C.text }}>
                Needs: {pct(needSpend, totalMonthlySpend)}% · Wants: {pct(wantSpend, totalMonthlySpend)}%
              </span>
            </div>
            <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${pct(needSpend, totalMonthlySpend)}%`, background: C.green }} />
              <div style={{ width: `${pct(wantSpend, totalMonthlySpend)}%`, background: C.accent }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── BENTO GRID SECTION 5: OBLIGATIONS & PEER DEBT ── */}
      <div className="bento-container">
        <div className="bento-col-6">
          <ObligationsWidget
            C={C}
            currency={currency}
            obligationsData={safeData?.breakdown?.obligations || {}}
            onRefresh={load}
            accounts={accounts}
          />
        </div>

        <div className="bento-col-6">
          <WhoOwesMeWidget
            C={C}
            currency={currency}
            splits={splits}
            splitsSummary={splitsSummary}
            onRefresh={load}
            accounts={accounts}
          />
        </div>
      </div>

      {/* ── BENTO GRID SECTION 6: CONNECTED ACCOUNTS ── */}
      <div className="bento-col-12">
        <AccountsWidget
          C={C}
          currency={currency}
          accounts={accounts}
          onRefresh={load}
        />
      </div>

      {/* ── QUICK PASTE MODAL (SMS/UPI PARSER) ── */}
      <QuickPasteModal
        C={C}
        currency={currency}
        isOpen={isQuickPasteOpen}
        onClose={() => setIsQuickPasteOpen(false)}
        onSaved={load}
        accounts={accounts}
      />
    </div>
  );
}
