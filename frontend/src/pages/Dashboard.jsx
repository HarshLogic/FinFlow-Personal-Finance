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
} from "../api";
import {
  fmt,
  pct,
  MetricCard,
  SectionTitle,
  Spinner,
  ErrorBox,
} from "../shared";

import SafeToSpendCard from "../components/SafeToSpendCard";
import ObligationsWidget from "../components/ObligationsWidget";
import WhoOwesMeWidget from "../components/WhoOwesMeWidget";
import QuickPasteModal from "../components/QuickPasteModal";
import AccountsWidget from "../components/AccountsWidget";
import { Sparkles } from "lucide-react";

export default function Dashboard({ C, currency }) {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [safeData, setSafeData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [splits, setSplits] = useState([]);
  const [splitsSummary, setSplitsSummary] = useState(null);

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
      ] = await Promise.allSettled([
        getSummary(),
        getExpenseAnalytics(),
        getSafeToSpend(),
        getAccounts(),
        getSplits(),
        getSplitsSummary(),
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
    } catch (e) {
      console.error("Dashboard error:", e);
      setError(
        e.response?.data?.error || "Failed to load dashboard"
      );
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
  // ASSET ALLOCATION
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
      fill: C.gold,
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

  // =====================================================
  // UI
  // =====================================================
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        position: "relative",
      }}
    >
      {/* =================================================
          TOP ACTION BAR: QUICK ADD / SMS PARSER
      ================================================= */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 13, color: C.muted }}>
          Smart Financial Control & Spending Limits
        </div>

        <button
          onClick={() => setIsQuickPasteOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 12,
            border: "none",
            background: `linear-gradient(135deg, ${C.gold} 0%, #B88925 100%)`,
            color: "#0D0F14",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(212, 168, 67, 0.35)",
            transition: "transform 0.15s",
          }}
        >
          <Sparkles size={16} />
          Quick Add via SMS
        </button>
      </div>

      {/* =================================================
          WIDGET 1: SAFE TO SPEND HERO CARD
      ================================================= */}
      <SafeToSpendCard
        C={C}
        currency={currency}
        safeData={safeData}
        onRefresh={load}
      />

      {/* =================================================
          METRICS CARDS
      ================================================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          width: "100%",
        }}
      >
        {/* TOTAL WEALTH */}
        <MetricCard
          C={C}
          icon="💰"
          label="Total Wealth"
          value={fmt(s.totalWealth, currency)}
          sub={`P&L ${s.totalPL >= 0 ? "+" : ""}${fmt(s.totalPL, currency)}`}
          subColor={s.totalPL >= 0 ? C.green : C.red}
        />

        {/* TOTAL INVESTED */}
        <MetricCard
          C={C}
          icon="📊"
          label="Total Invested"
          value={fmt(s.totalInvested, currency)}
          sub="Across all assets"
        />

        {/* MONTHLY SPENDING */}
        <MetricCard
          C={C}
          icon="💸"
          label="Monthly Spending"
          value={fmt(totalMonthlySpend, currency)}
          sub={`Needs ${fmt(needSpend, currency)} · Wants ${fmt(wantSpend, currency)}`}
        />

        {/* LIQUID CASH */}
        <MetricCard
          C={C}
          icon="🏦"
          label="Liquid Cash"
          value={fmt(liquidVal, currency)}
          sub="Available in accounts"
        />
      </div>

      {/* =================================================
          WIDGET 2 & 4: OBLIGATIONS & PEER DEBT SPLITTING
      ================================================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        {/* WIDGET 2: FIXED OBLIGATIONS TRACKER */}
        <ObligationsWidget
          C={C}
          currency={currency}
          obligationsData={safeData?.breakdown?.obligations || {}}
          onRefresh={load}
          accounts={accounts}
        />

        {/* WIDGET 4: WHO OWES ME (PEER DEBT) */}
        <WhoOwesMeWidget
          C={C}
          currency={currency}
          splits={splits}
          splitsSummary={splitsSummary}
          onRefresh={load}
          accounts={accounts}
        />
      </div>

      {/* =================================================
          CONNECTED ACCOUNTS WIDGET
      ================================================= */}
      <AccountsWidget
        C={C}
        currency={currency}
        accounts={accounts}
        onRefresh={load}
      />

      {/* =================================================
          MONTHLY EXPENSE FLOW CHART
      ================================================= */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 20,
        }}
      >
        <SectionTitle C={C}>Monthly Expense Flow</SectionTitle>

        {flowData.length === 0 ? (
          <div
            style={{
              color: C.muted,
              fontSize: 13,
              textAlign: "center",
              padding: 32,
            }}
          >
            No expense data yet — add some transactions first.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={flowData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 5,
              }}
            >
              <defs>
                <linearGradient id="gNeed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.green} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                </linearGradient>

                <linearGradient id="gWant" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.gold} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={C.gold} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />

              <XAxis
                dataKey="month"
                tick={{
                  fill: C.muted,
                  fontSize: 12,
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis tickFormatter={(v) => fmt(v, currency)} />

              <Tooltip
                formatter={(value) => fmt(value, currency)}
                contentStyle={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  color: C.text,
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
                stroke={C.gold}
                fill="url(#gWant)"
                strokeWidth={2}
                name="Wants"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* =================================================
          BOTTOM SECTION: ALLOCATION & 50-30-20
      ================================================= */}
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* ASSET ALLOCATION */}
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 20,
            flex: 1,
            minWidth: 240,
          }}
        >
          <SectionTitle C={C}>Asset Allocation</SectionTitle>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={allocationData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={62}
                  paddingAngle={3}
                >
                  {allocationData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                flex: 1,
              }}
            >
              {allocationData.map((d) => (
                <div
                  key={d.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: d.fill,
                      flexShrink: 0,
                    }}
                  />

                  <span
                    style={{
                      fontSize: 12,
                      color: C.muted,
                      flex: 1,
                    }}
                  >
                    {d.name}
                  </span>

                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.text,
                      fontFamily: "monospace",
                    }}
                  >
                    {d.value}k
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* NEEDS VS WANTS */}
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 20,
            flex: 1,
            minWidth: 240,
          }}
        >
          <SectionTitle C={C}>This Month — Needs vs Wants</SectionTitle>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {[
              {
                label: "Needs",
                val: needSpend,
                color: C.green,
              },
              {
                label: "Wants",
                val: wantSpend,
                color: C.gold,
              },
            ].map((r) => {
              const total = totalMonthlySpend;

              return (
                <div key={r.label}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: C.muted,
                      }}
                    >
                      {r.label}
                    </span>

                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.text,
                      }}
                    >
                      {fmt(r.val, currency)}
                    </span>
                  </div>

                  <div
                    style={{
                      height: 8,
                      background: C.border,
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct(r.val, total)}%`,
                        background: r.color,
                        borderRadius: 4,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      marginTop: 2,
                    }}
                  >
                    {pct(r.val, total)}% of spend
                  </div>
                </div>
              );
            })}

            {/* 50-30-20 */}
            <div
              style={{
                marginTop: 4,
                paddingTop: 12,
                borderTop: `1px solid ${C.border}`,
                fontSize: 12,
                color: C.muted,
              }}
            >
              50-30-20 Rule — Needs{" "}
              <span
                style={{
                  color: C.green,
                }}
              >
                {pct(needSpend, totalMonthlySpend)}%
              </span>{" "}
              · Savings{" "}
              <span
                style={{
                  color: C.blue,
                }}
              >
                {pct(s.totalInvested, s.totalWealth)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          WIDGET 3: QUICK PASTE MODAL
      ================================================= */}
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
