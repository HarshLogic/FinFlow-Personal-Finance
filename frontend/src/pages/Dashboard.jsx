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

import { getSummary, getExpenseAnalytics } from "../api";
import {
  fmt,
  pct,
  MetricCard,
  SectionTitle,
  Spinner,
  ErrorBox,
} from "../shared";

export default function Dashboard({ C, currency }) {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // =====================================================
  // LOAD DASHBOARD DATA
  // =====================================================
  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const [summaryResponse, analyticsResponse] =
        await Promise.all([
          getSummary(),
          getExpenseAnalytics(),
        ]);

      console.log("SUMMARY RESPONSE:", summaryResponse.data);
      console.log("ANALYTICS RESPONSE:", analyticsResponse.data);

      setSummary(summaryResponse.data);
      setAnalytics(analyticsResponse.data || []);
    } catch (e) {
      console.error("Dashboard error:", e);

      setError(
        e.response?.data?.error ||
          "Failed to load dashboard"
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

    const key = `${_id.year}-${String(
      _id.month
    ).padStart(2, "0")}`;

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

  if (error) {
    return (
      <ErrorBox
        C={C}
        message={error}
        onRetry={load}
      />
    );
  }

  if (!summary) {
    return null;
  }

  // =====================================================
  // GET SUMMARY DATA
  // =====================================================
  const { summary: s, expenses } = summary;

  // Make sure values are numbers
  const needSpend = Number(
    expenses?.needSpend || 0
  );

  const wantSpend = Number(
    expenses?.wantSpend || 0
  );

  const totalMonthlySpend =
    needSpend + wantSpend;

  console.log("Monthly Need:", needSpend);
  console.log("Monthly Want:", wantSpend);
  console.log(
    "Monthly Total:",
    totalMonthlySpend
  );

  const { allocation } = s;

  // =====================================================
  // ASSET ALLOCATION
  // =====================================================
  const allocationData = [
    {
      name: "Liquid",
      value: Math.round(
        allocation.liquid.value / 1000
      ),
      fill: C.blue,
    },
    {
      name: "Stocks",
      value: Math.round(
        allocation.stocks.value / 1000
      ),
      fill: C.gold,
    },
    {
      name: "Mutual Funds",
      value: Math.round(
        allocation.mutualFunds.value / 1000
      ),
      fill: C.purple,
    },
    {
      name: "Fixed Deposits",
      value: Math.round(
        allocation.fixedDeposits.value / 1000
      ),
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
      }}
    >
      {/* =================================================
          METRICS
      ================================================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          width: "100%",
        }}
      >
        {/* TOTAL WEALTH */}
        <MetricCard
          C={C}
          icon="💰"
          label="Total Wealth"
          value={fmt(
            s.totalWealth,
            currency
          )}
          sub={`P&L ${
            s.totalPL >= 0 ? "+" : ""
          }${fmt(
            s.totalPL,
            currency
          )}`}
          subColor={
            s.totalPL >= 0
              ? C.green
              : C.red
          }
        />

        {/* TOTAL INVESTED */}
        <MetricCard
          C={C}
          icon="📊"
          label="Total Invested"
          value={fmt(
            s.totalInvested,
            currency
          )}
          sub="Across all assets"
        />

        {/* MONTHLY SPENDING */}
        <MetricCard
          C={C}
          icon="💸"
          label="Monthly Spending"
          value={fmt(
            totalMonthlySpend,
            currency
          )}
          sub={`Needs ${fmt(
            needSpend,
            currency
          )} · Wants ${fmt(
            wantSpend,
            currency
          )}`}
        />

        {/* LIQUID CASH */}
        <MetricCard
          C={C}
          icon="🏦"
          label="Liquid Cash"
          value={fmt(
            allocation.liquid.value,
            currency
          )}
          sub="Available"
        />
      </div>

      {/* =================================================
          MONTHLY EXPENSE FLOW
      ================================================= */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 20,
        }}
      >
        <SectionTitle C={C}>
          Monthly Expense Flow
        </SectionTitle>

        {flowData.length === 0 ? (
          <div
            style={{
              color: C.muted,
              fontSize: 13,
              textAlign: "center",
              padding: 32,
            }}
          >
            No expense data yet — add
            some transactions first.
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={220}
          >
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
                <linearGradient
                  id="gNeed"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={C.green}
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor={C.green}
                    stopOpacity={0}
                  />
                </linearGradient>

                <linearGradient
                  id="gWant"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={C.gold}
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor={C.gold}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke={C.border}
              />

              <XAxis
                dataKey="month"
                tick={{
                  fill: C.muted,
                  fontSize: 12,
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tickFormatter={(v) =>
                  fmt(v, currency)
                }
              />

              <Tooltip
                formatter={(value) =>
                  fmt(value, currency)
                }
                contentStyle={{
                  background:
                    C.surface,
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
          BOTTOM SECTION
      ================================================= */}
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* =================================================
            ASSET ALLOCATION
        ================================================= */}
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
          <SectionTitle C={C}>
            Asset Allocation
          </SectionTitle>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <ResponsiveContainer
              width={140}
              height={140}
            >
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
                  {allocationData.map(
                    (d, i) => (
                      <Cell
                        key={i}
                        fill={d.fill}
                      />
                    )
                  )}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div
              style={{
                display: "flex",
                flexDirection:
                  "column",
                gap: 10,
                flex: 1,
              }}
            >
              {allocationData.map(
                (d) => (
                  <div
                    key={d.name}
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius:
                          "50%",
                        background:
                          d.fill,
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
                        fontFamily:
                          "monospace",
                      }}
                    >
                      {d.value}k
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* =================================================
            NEEDS VS WANTS
        ================================================= */}
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
          <SectionTitle C={C}>
            This Month — Needs vs Wants
          </SectionTitle>

          <div
            style={{
              display: "flex",
              flexDirection:
                "column",
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
              const total =
                totalMonthlySpend;

              return (
                <div key={r.label}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
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
                      {fmt(
                        r.val,
                        currency
                      )}
                    </span>
                  </div>

                  <div
                    style={{
                      height: 8,
                      background:
                        C.border,
                      borderRadius: 4,
                      overflow:
                        "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct(
                          r.val,
                          total
                        )}%`,
                        background:
                          r.color,
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
                    {pct(
                      r.val,
                      total
                    )}
                    % of spend
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
                {pct(
                  needSpend,
                  totalMonthlySpend
                )}
                %
              </span>

              {" "}· Savings{" "}

              <span
                style={{
                  color: C.blue,
                }}
              >
                {pct(
                  s.totalInvested,
                  s.totalWealth
                )}
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}