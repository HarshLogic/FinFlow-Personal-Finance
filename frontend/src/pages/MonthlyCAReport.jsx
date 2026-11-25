import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  Info,
  ShieldCheck,
} from "lucide-react";

import {
  getMonthlyReport,
  generateMonthlyReport,
  getMonthlyReportsHistory,
  exportReportPDF,
  exportReportCSV,
} from "../api";
import { fmt, Spinner, ErrorBox } from "../shared";

export default function MonthlyCAReport({ C, currency }) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Fetch report data
  const loadReport = async (y, m) => {
    setLoading(true);
    setError(null);
    try {
      const [repRes, histRes] = await Promise.allSettled([
        getMonthlyReport(y, m),
        getMonthlyReportsHistory(),
      ]);

      if (repRes.status === "fulfilled" && repRes.value?.data?.report) {
        setReport(repRes.value.data.report);
      } else {
        // Fallback: auto generate if not exists
        const genRes = await generateMonthlyReport({ year: y, month: m });
        setReport(genRes?.data?.report || null);
      }

      if (histRes.status === "fulfilled") {
        setHistory(histRes.value?.data?.history || []);
      }
    } catch (err) {
      console.error("Failed to load CA report:", err);
      setError(err.response?.data?.error || "Failed to load Monthly Personal CA Report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // Force regenerate
  const handleRegenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await generateMonthlyReport({
        year: selectedYear,
        month: selectedMonth,
        forceRegenerate: true,
      });
      setReport(res.data?.report || null);
      const histRes = await getMonthlyReportsHistory();
      setHistory(histRes.data?.history || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to regenerate report.");
    } finally {
      setGenerating(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    setExporting(true);
    try {
      const res = await exportReportPDF(selectedYear, selectedMonth);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `finflow-ca-report-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export PDF: " + (err.response?.data?.error || err.message));
    } finally {
      setExporting(false);
    }
  };

  // Download CSV
  const handleDownloadCSV = async () => {
    setExporting(true);
    try {
      const res = await exportReportCSV(selectedYear, selectedMonth);
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `finflow-ca-report-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export CSV: " + (err.response?.data?.error || err.message));
    } finally {
      setExporting(false);
    }
  };

  const summary = report?.financialSummary || {};
  const health = report?.healthScore || { score: 0, rating: "N/A", breakdown: {} };
  const spending = report?.spendingAnalysis || {};
  const investment = report?.investmentAnalysis || {};
  const recommendations = report?.recommendations || [];
  const actionPlan = report?.nextMonthActionPlan || [];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }}>
      {/* Header controls & Period Selector */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
          padding: "20px 24px",
          background: C.surface,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <FileText size={24} color={C.gold} />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>
              Monthly Personal CA Report
            </h1>
            {report?.isProvisional && (
              <span
                style={{
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: "#F9731622",
                  color: "#F97316",
                  fontWeight: 600,
                  border: "1px solid #F9731644",
                }}
              >
                Provisional (Month In Progress)
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: C.muted }}>
            Automated chartered accountant financial review, health audit, and strategic wealth roadmap.
          </p>
        </div>

        {/* Month/Year selector & Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              background: C.card,
              color: C.text,
              border: `1px solid ${C.border}`,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {monthNames.map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              background: C.card,
              color: C.text,
              border: `1px solid ${C.border}`,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Regenerate Button */}
          <button
            onClick={handleRegenerate}
            disabled={generating}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 14px",
              borderRadius: 8,
              background: C.card,
              color: C.text,
              border: `1px solid ${C.border}`,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} className={generating ? "animate-spin" : ""} />
            {generating ? "Recalculating..." : "Refresh"}
          </button>

          {/* Export PDF Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={exporting || loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 14px",
              borderRadius: 8,
              background: C.accent || C.gold,
              color: "#FFFFFF",
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            <Download size={14} />
            Download PDF
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleDownloadCSV}
            disabled={exporting || loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 14px",
              borderRadius: 8,
              background: C.card,
              color: C.text,
              border: `1px solid ${C.border}`,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <FileSpreadsheet size={14} />
            CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <Spinner C={C} />
          <p style={{ marginTop: 16, color: C.muted, fontSize: 14 }}>
            Aggregating ledger data and compiling your CA Financial Review...
          </p>
        </div>
      ) : error ? (
        <ErrorBox message={error} retry={() => loadReport(selectedYear, selectedMonth)} />
      ) : (
        <>
          {/* 1. FINANCIAL HEALTH SCORE HERO CARD */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 20,
              marginBottom: 24,
            }}
          >
            {/* Score Radial Box */}
            <div
              style={{
                background: C.surface,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                padding: "24px 28px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>
                    Financial Health Score
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
                    <span style={{ fontSize: 44, fontWeight: 800, color: health.color }}>
                      {health.score}
                    </span>
                    <span style={{ fontSize: 18, color: C.muted, fontWeight: 500 }}>/ 100</span>
                  </div>
                </div>
                <div
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    background: `${health.color}15`,
                    color: health.color,
                    border: `1px solid ${health.color}33`,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {health.rating}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: 16, marginBottom: 16 }}>
                <div style={{ width: "100%", height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${health.score}%`,
                      height: "100%",
                      background: health.color,
                      borderRadius: 4,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.muted }}>
                <Info size={14} />
                <span>
                  Evaluated across savings rate, 50-30-20 budget discipline, liquid runway, and commitments.
                </span>
              </div>
            </div>

            {/* Health Factors Quick Breakdown */}
            <div
              style={{
                background: C.surface,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <h3 style={{ margin: "0 0 4px 0", fontSize: 14, fontWeight: 700, color: C.text }}>
                Score Composition Factors
              </h3>
              {[
                { label: "Savings Performance", val: health.breakdown?.savingsPerformance?.score || 0, max: 25 },
                { label: "Budget Discipline (Needs vs Wants)", val: health.breakdown?.budgetDiscipline?.score || 0, max: 20 },
                { label: "Emergency Buffer Runway", val: health.breakdown?.emergencyFundCoverage?.score || 0, max: 20 },
                { label: "Debt & Fixed Obligations Ratio", val: health.breakdown?.debtAndObligations?.score || 0, max: 15 },
                { label: "Investment Consistency", val: health.breakdown?.investmentConsistency?.score || 0, max: 10 },
                { label: "Cash Flow Stability", val: health.breakdown?.cashFlowStability?.score || 0, max: 10 },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: C.muted }}>{f.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 80, height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${(f.val / f.max) * 100}%`,
                          height: "100%",
                          background: f.val >= (f.max * 0.7) ? C.green : C.gold,
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <span style={{ fontWeight: 600, color: C.text, minWidth: 38, textAlign: "right" }}>
                      {f.val}/{f.max}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 1.5. SELF-REPORTED FINANCIAL FOUNDATION (SAFETY NETS) */}
          <div
            style={{
              background: C.surface,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              padding: "20px 24px",
              marginBottom: 24,
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 20,
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <ShieldCheck size={18} color={C.green} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                  Financial Foundation Milestones
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: `${C.accent}18`,
                    color: C.accent,
                    border: `1px solid ${C.accent}33`,
                  }}
                >
                  Self-Reported Assessment
                </span>
              </div>
              <p style={{ margin: "0 0 12px 0", fontSize: 12, color: C.muted, lineHeight: 1.4 }}>
                {report?.financialFoundation?.note ||
                  "Independent of your transactional Financial Health Score above. Evaluates baseline protection before wealth creation."}
              </p>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: report?.financialFoundation?.emergencyFund?.completed ? C.green : C.muted,
                    }}
                  />
                  <strong style={{ color: C.text }}>Emergency Fund (3-6m):</strong>
                  <span style={{ color: report?.financialFoundation?.emergencyFund?.completed ? C.green : C.muted }}>
                    {report?.financialFoundation?.emergencyFund?.completed ? "Reported Active (+50 pts)" : "Not Yet Set (0 pts)"}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: report?.financialFoundation?.healthInsurance?.completed ? C.blue : C.muted,
                    }}
                  />
                  <strong style={{ color: C.text }}>Health Insurance:</strong>
                  <span style={{ color: report?.financialFoundation?.healthInsurance?.completed ? C.blue : C.muted }}>
                    {report?.financialFoundation?.healthInsurance?.completed ? "Reported Active (+50 pts)" : "Not Yet Set (0 pts)"}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Foundation Score
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: (report?.financialFoundation?.score || 0) === 100 ? C.green : (report?.financialFoundation?.score || 0) === 50 ? C.blue : C.warning,
                  marginTop: 2,
                }}
              >
                {report?.financialFoundation?.score || 0}
                <span style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>/100</span>
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                {report?.financialFoundation?.classification || "Starting Journey"}
              </div>
            </div>
          </div>

          {/* 2. FINANCIAL SUMMARY KPI GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {[
              { label: "Total Income", val: fmt(summary.totalIncome, currency), sub: "Cash inflow", color: C.green },
              { label: "Personal Expenses", val: fmt(summary.totalExpenses, currency), sub: "Consumption", color: C.red },
              { label: "Net Savings", val: fmt(summary.totalSavings, currency), sub: `Rate: ${(summary.savingsRate || 0).toFixed(1)}%`, color: C.gold },
              { label: "Liquid Cash", val: fmt(summary.liquidBalance, currency), sub: "Available reserves", color: C.blue },
              { label: "Fixed Obligations", val: fmt(summary.fixedCommitments, currency), sub: `Pending: ${fmt(summary.pendingBills, currency)}`, color: C.muted },
              { label: "Estimated Net Worth", val: fmt(summary.netWorth, currency), sub: summary.netWorthChange >= 0 ? `+${fmt(summary.netWorthChange, currency)} MoM` : `${fmt(summary.netWorthChange, currency)} MoM`, color: C.purple },
            ].map((kpi, idx) => (
              <div
                key={idx}
                style={{
                  background: C.surface,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  padding: "16px 20px",
                }}
              >
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 6, fontWeight: 500 }}>
                  {kpi.label}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>
                  {kpi.val}
                </div>
                <div style={{ fontSize: 11, color: kpi.color, fontWeight: 600 }}>
                  {kpi.sub}
                </div>
              </div>
            ))}
          </div>

          {/* 3. SPENDING & 50-30-20 ANALYSIS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: 20,
              marginBottom: 24,
            }}
          >
            {/* 50-30-20 Rule Card */}
            <div
              style={{
                background: C.surface,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                padding: "24px",
              }}
            >
              <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: C.text }}>
                50-30-20 Financial Health Benchmark
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Needs */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: C.text, fontWeight: 600 }}>
                      Essentials (Needs) — Target 50%
                    </span>
                    <span style={{ fontWeight: 700, color: C.blue }}>
                      {fmt(spending.needSpend, currency)} ({(spending.needPct || 0).toFixed(1)}%)
                    </span>
                  </div>
                  <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, spending.needPct || 0)}%`, height: "100%", background: C.blue, borderRadius: 4 }} />
                  </div>
                </div>

                {/* Wants */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: C.text, fontWeight: 600 }}>
                      Discretionary (Wants) — Target 30%
                    </span>
                    <span style={{ fontWeight: 700, color: (spending.wantPct || 0) > 35 ? C.red : C.gold }}>
                      {fmt(spending.wantSpend, currency)} ({(spending.wantPct || 0).toFixed(1)}%)
                    </span>
                  </div>
                  <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.min(100, spending.wantPct || 0)}%`,
                        height: "100%",
                        background: (spending.wantPct || 0) > 35 ? C.red : C.gold,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>

                {/* Savings */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: C.text, fontWeight: 600 }}>
                      Savings & Investments — Target 20%
                    </span>
                    <span style={{ fontWeight: 700, color: C.green }}>
                      {fmt(summary.totalSavings, currency)} ({(summary.savingsRate || 0).toFixed(1)}%)
                    </span>
                  </div>
                  <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, summary.savingsRate || 0)}%`, height: "100%", background: C.green, borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Top Spending Categories */}
            <div
              style={{
                background: C.surface,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                padding: "24px",
              }}
            >
              <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: C.text }}>
                Top Spending Categories
              </h3>
              {(spending.topCategories || []).length === 0 ? (
                <div style={{ color: C.muted, fontSize: 13, padding: "20px 0" }}>
                  No spending categorized for this reporting month.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(spending.topCategories || []).slice(0, 5).map((cat, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, color: C.text }}>{cat.category}</span>
                        <span style={{ color: C.muted }}>
                          {fmt(cat.amount, currency)} ({cat.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${Math.min(100, cat.percentage)}%`,
                            height: "100%",
                            background: C.gold,
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Investment & Savings Target Portfolio Breakdown */}
          <div
            style={{
              background: C.surface,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              padding: "24px",
              marginBottom: 24,
            }}
          >
            <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: C.text }}>
              Savings Target & Wealth Asset Allocation
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              <div style={{ padding: "14px 16px", borderRadius: 10, background: C.card, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.muted }}>Monthly Savings Target</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginTop: 4 }}>
                  {fmt(investment.savingsTarget || 0, currency)}
                </div>
                <div style={{ fontSize: 11, color: C.green, marginTop: 2 }}>
                  Achieved: {investment.targetCompletionPct || 0}%
                </div>
              </div>

              <div style={{ padding: "14px 16px", borderRadius: 10, background: C.card, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.muted }}>Stocks Holdings</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginTop: 4 }}>
                  {fmt(investment.portfolioAllocation?.stocks || 0, currency)}
                </div>
              </div>

              <div style={{ padding: "14px 16px", borderRadius: 10, background: C.card, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.muted }}>Mutual Funds & SIPs</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginTop: 4 }}>
                  {fmt(investment.portfolioAllocation?.mutualFunds || 0, currency)}
                </div>
                <div style={{ fontSize: 11, color: C.gold, marginTop: 2 }}>
                  SIP Status: {investment.sipConsistency || "Active"}
                </div>
              </div>

              <div style={{ padding: "14px 16px", borderRadius: 10, background: C.card, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.muted }}>Fixed Deposits (Maturity)</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginTop: 4 }}>
                  {fmt(investment.portfolioAllocation?.fixedDeposits || 0, currency)}
                </div>
              </div>
            </div>

            {history.length > 1 && (
              <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>Quick Switch Month:</span>
                {history.slice(0, 5).map((h) => (
                  <button
                    key={`${h.year}-${h.month}`}
                    onClick={() => {
                      setSelectedYear(h.year);
                      setSelectedMonth(h.month);
                    }}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      background: h.year === selectedYear && h.month === selectedMonth ? (C.accent || C.gold) : C.card,
                      color: h.year === selectedYear && h.month === selectedMonth ? "#FFFFFF" : C.text,
                      border: `1px solid ${C.border}`,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {h.reportingPeriod?.label || `${h.month}/${h.year}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4. PERSONALIZED RECOMMENDATIONS SECTION */}
          <div
            style={{
              background: C.surface,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              padding: "24px",
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <Sparkles size={20} color={C.accent || C.gold} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>
                Actionable Chartered Accountant Recommendations
              </h3>
            </div>

            {recommendations.length === 0 ? (
              <div style={{ padding: "16px 0", color: C.muted, fontSize: 13 }}>
                No active recommendations. Your financial discipline is on track.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {recommendations.map((rec, i) => {
                  const pBadge = rec.priority === "HIGH" ? { bg: `${C.error}18`, text: C.error, border: `${C.error}33` }
                    : rec.priority === "MEDIUM" ? { bg: `${C.warning}18`, text: C.warning, border: `${C.warning}33` }
                    : { bg: `${C.success}18`, text: C.success, border: `${C.success}33` };

                  return (
                    <div
                      key={i}
                      style={{
                        padding: "18px 20px",
                        borderRadius: 12,
                        background: C.card,
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 4,
                              background: pBadge.bg,
                              color: pBadge.text,
                              border: `1px solid ${pBadge.border}`,
                            }}
                          >
                            {rec.priority} PRIORITY
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                            {rec.title}
                          </span>
                        </div>
                      </div>

                      <p style={{ margin: "0 0 8px 0", fontSize: 13, color: C.muted }}>
                        {rec.reason}
                      </p>

                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                        👉 Suggested Action: <span style={{ fontWeight: 400 }}>{rec.suggestedAction}</span>
                      </div>

                      {rec.estimatedImpact && (
                        <div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>
                          💰 Impact: {rec.estimatedImpact}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. NEXT MONTH ROADMAP */}
          <div
            style={{
              background: C.surface,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              padding: "24px",
              marginBottom: 24,
            }}
          >
            <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: C.text }}>
              Next Month's Strategic Roadmap
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              {actionPlan.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 10,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      background: C.accent || C.gold,
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.4 }}>
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 12,
              background: C.card,
              border: `1px solid ${C.border}`,
              fontSize: 11,
              color: C.muted,
              lineHeight: 1.5,
            }}
          >
            <strong>Regulatory & Financial Disclosure:</strong> This Monthly Personal CA Report is an automated financial analysis tool generated by FinFlow based on user-entered ledger records. It is intended solely for personal budgeting and wealth planning purposes and does not replace a certified Chartered Accountant (CA), registered financial advisor, or legal tax consultant.
          </div>
        </>
      )}
    </div>
  );
}
