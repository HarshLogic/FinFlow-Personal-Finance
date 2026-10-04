import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  getExpenses,
  createExpense,
  deleteExpense,
  exportExpenses,
  getIncome,
  createIncome,
  // deleteIncome,
} from "../api";

import {
  fmt,
  MetricCard,
  SectionTitle,
  Pill,
  Spinner,
  ErrorBox,
  CAT_ICON,
  CATEGORIES,
} from "../shared";

const EMPTY = {
  txnType: "expense",
  date: "",
  category: "Food",
  label: "",
  amount: "",
  type: "need",
  notes: "",
};

export default function ExpenseTracker({ C, currency }) {
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // --------------------------------------------------
  // LOAD EXPENSES
  // --------------------------------------------------
  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await getExpenses({ limit: 100 });
      setExpenses(data.expenses || []);
    } catch (e) {
      setError(
        e.response?.data?.error || "Failed to load expenses"
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // LOAD INCOME
  // --------------------------------------------------
  const loadIncome = async () => {
    try {
      const { data } = await getIncome({ limit: 100 });

      setIncome(
        data.income ||
        data.incomes ||
        data ||
        []
      );
    } catch (e) {
      console.error("Failed to load income:", e);
    }
  };

  useEffect(() => {
    load();
    loadIncome();
  }, []);

  // --------------------------------------------------
  // ADD TRANSACTION
  // --------------------------------------------------
const add = async () => {
  if (!form.label || !form.amount || !form.date) {
    setError("Please fill description, amount and date.");
    return;
  }

  setSaving(true);
  setError(null);

  try {
    // -------------------------
    // INCOME
    // -------------------------
    if (form.txnType === "income") {
      const payload = {
        source: form.label,
        amount: Number(form.amount),
        date: form.date,
      };

      const { data } = await createIncome(payload);

      setIncome((prev) => [
        data.income || data,
        ...prev,
      ]);
    }

    // -------------------------
    // EXPENSE
    // -------------------------
    else {
      const payload = {
        date: form.date,
        category: form.category,
        label: form.label,
        amount: Number(form.amount),
        type: form.type,
        notes: form.notes,
      };

      const { data } = await createExpense(payload);

      setExpenses((prev) => [
        data.expense || data,
        ...prev,
      ]);
    }

    setForm(EMPTY);
  } catch (e) {
    console.error("Add transaction error:", e);

    setError(
      e.response?.data?.error ||
      "Failed to add transaction"
    );
  } finally {
    setSaving(false);
  }
};

  // --------------------------------------------------
  // DELETE EXPENSE
  // --------------------------------------------------
  const del = async (id) => {
    try {
      await deleteExpense(id);

      setExpenses((prevExpenses) =>
        prevExpenses.filter((e) => e._id !== id)
      );
    } catch (e) {
      const errorMsg =
        e.response?.data?.error ||
        "Failed to delete";

      setError(errorMsg);
    }
  };

  // --------------------------------------------------
  // DELETE INCOME
  // --------------------------------------------------
  // const deleteIncomeItem = async (id) => {
  //   try {
  //     await deleteIncome(id);

  //     setIncome((prevIncome) =>
  //       prevIncome.filter((item) => item._id !== id)
  //     );
  //   } catch (e) {
  //     const errorMsg =
  //       e.response?.data?.error ||
  //       "Failed to delete income";

  //     setError(errorMsg);
  //   }
  // };

  // --------------------------------------------------
  // EXPORT
  // --------------------------------------------------
  const handleExport = async () => {
    if (!expenses || expenses.length === 0) {
      setError("No transactions available to export.");
      return;
    }

    try {
      const response = await exportExpenses();

      const blob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data], {
              type: "text/csv",
            });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.setAttribute(
        "download",
        "finflow-transactions.csv"
      );

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export error:", e);
      setError("Failed to export transactions.");
    }
  };

  // --------------------------------------------------
  // DERIVED DATA
  // --------------------------------------------------
  const {
    needSpend,
    wantSpend,
    catData,
    filtered,
  } = useMemo(() => {
    const needs = expenses
      .filter((e) => e.type === "need")
      .reduce(
        (s, e) => s + Number(e.amount || 0),
        0
      );

    const wants = expenses
      .filter((e) => e.type === "want")
      .reduce(
        (s, e) => s + Number(e.amount || 0),
        0
      );

    const categories = CATEGORIES
      .map((c) => ({
        name: c,

        need: expenses
          .filter(
            (e) =>
              e.category === c &&
              e.type === "need"
          )
          .reduce(
            (s, e) => s + Number(e.amount || 0),
            0
          ),

        want: expenses
          .filter(
            (e) =>
              e.category === c &&
              e.type === "want"
          )
          .reduce(
            (s, e) => s + Number(e.amount || 0),
            0
          ),
      }))
      .filter((c) => c.need + c.want > 0);

    const filteredData =
      filter === "all"
        ? expenses
        : expenses.filter(
            (e) => e.type === filter
          );

    return {
      needSpend: needs,
      wantSpend: wants,
      catData: categories,
      filtered: filteredData,
    };
  }, [expenses, filter]);

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------
  if (loading) {
    return <Spinner C={C} />;
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* ERROR */}
      {error && (
        <ErrorBox
          C={C}
          message={error}
          onRetry={load}
        />
      )}

      {/* -------------------------------------------- */}
      {/* METRICS */}
      {/* -------------------------------------------- */}

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <MetricCard
          C={C}
          icon="✅"
          label="Total Needs"
          value={fmt(needSpend, currency)}
          subColor={C.green}
          sub="Essential expenses"
        />

        <MetricCard
          C={C}
          icon="🎯"
          label="Total Wants"
          value={fmt(wantSpend, currency)}
          subColor={C.gold}
          sub="Lifestyle expenses"
        />

        <MetricCard
          C={C}
          icon="📋"
          label="Total Entries"
          value={expenses.length}
          sub={`${expenses.filter(
            (e) => e.type === "need"
          ).length} needs · ${expenses.filter(
            (e) => e.type === "want"
          ).length} wants`}
        />

        <MetricCard
          C={C}
          icon="💰"
          label="Total Income"
          value={fmt(
            income.reduce(
              (sum, item) =>
                sum + Number(item.amount || 0),
              0
            ),
            currency
          )}
          subColor={C.green}
          sub="Money received"
        />
      </div>

      {/* -------------------------------------------- */}
      {/* ADD TRANSACTION FORM */}
      {/* -------------------------------------------- */}

      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 20,
        }}
      >
        <SectionTitle C={C}>
          Add Transaction
        </SectionTitle>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          {/* TRANSACTION TYPE */}

          <select
            value={form.txnType}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                txnType: e.target.value,
              }))
            }
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.text,
              width: 110,
            }}
          >
            <option value="expense">
              Expense
            </option>

            <option value="income">
              Income
            </option>
          </select>

          {/* DATE / DESCRIPTION / AMOUNT */}

          {[
            {
              field: "date",
              type: "date",
              placeholder: "Date",
              width: 145,
            },
            {
              field: "label",
              type: "text",
              placeholder: "Description",
              width: 160,
            },
            {
              field: "amount",
              type: "number",
              placeholder: "Amount ₹",
              width: 120,
            },
          ].map((f) => (
            <input
              key={f.field}
              type={f.type}
              placeholder={f.placeholder}
              value={form[f.field]}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  [f.field]: e.target.value,
                }))
              }
              style={{
                width: f.width,
                padding: "9px 12px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.text,
                fontSize: 13,
                outline: "none",
              }}
            />
          ))}

          {/* CATEGORY - ONLY FOR EXPENSE */}

          {form.txnType === "expense" && (
            <select
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  category: e.target.value,
                }))
              }
              style={{
                padding: "9px 12px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.text,
                fontSize: 13,
              }}
            >
              {CATEGORIES.map((c) => (
                <option
                  key={c}
                  value={c}
                >
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* NEED / WANT - ONLY FOR EXPENSE */}

          {form.txnType === "expense" && (
            <div
              style={{
                display: "flex",
                gap: 8,
              }}
            >
              {["need", "want"].map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      type: t,
                    }))
                  }
                  style={{
                    padding: "9px 16px",
                    borderRadius: 8,
                    border: `1px solid ${
                      form.type === t
                        ? C.gold
                        : C.border
                    }`,
                    background:
                      form.type === t
                        ? C.gold + "22"
                        : C.surface,
                    color:
                      form.type === t
                        ? C.gold
                        : C.muted,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform:
                      "capitalize",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* ADD BUTTON */}

          <button
            onClick={add}
            disabled={saving}
            style={{
              padding: "9px 20px",
              background: saving
                ? C.goldDim
                : C.gold,
              color: "#0D0F14",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: saving
                ? "not-allowed"
                : "pointer",
            }}
          >
            {saving
              ? "Saving…"
              : "+ Add"}
          </button>
        </div>
      </div>

      {/* -------------------------------------------- */}
      {/* CHART + TRANSACTIONS */}
      {/* -------------------------------------------- */}

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* CATEGORY CHART */}

        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 20,
            flex: "1 1 300px",
          }}
        >
          <SectionTitle C={C}>
            Spend by Category
          </SectionTitle>

          <ResponsiveContainer
            width="100%"
            height={220}
          >
            <BarChart
              data={catData}
              margin={{ left: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={C.border}
              />

              <XAxis
                dataKey="name"
                tick={{
                  fill: C.muted,
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{
                  fill: C.muted,
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  fmt(v, currency)
                }
              />

              <Tooltip
                formatter={(value) =>
                  fmt(value, currency)
                }
                contentStyle={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  color: C.text,
                }}
              />

              <Bar
                dataKey="need"
                fill={C.green}
                radius={[4, 4, 0, 0]}
                name="Need"
              />

              <Bar
                dataKey="want"
                fill={C.gold}
                radius={[4, 4, 0, 0]}
                name="Want"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* TRANSACTION LIST */}

        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 20,
            flex: "1 1 300px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <SectionTitle C={C}>
              Transactions
            </SectionTitle>

            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              {/* EXPORT */}

              <button
                onClick={handleExport}
                style={{
                  background:
                    "transparent",
                  border: `1px solid ${C.border}`,
                  padding: "4px 10px",
                  borderRadius: 20,
                  color: C.muted,
                  fontSize: 10,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Export CSV
              </button>

              {/* FILTER */}

              <div
                style={{
                  display: "flex",
                  gap: 6,
                }}
              >
                {[
                  "all",
                  "need",
                  "want",
                ].map((f) => (
                  <button
                    key={f}
                    onClick={() =>
                      setFilter(f)
                    }
                    style={{
                      padding:
                        "5px 12px",
                      borderRadius: 20,
                      border: `1px solid ${
                        filter === f
                          ? C.gold
                          : C.border
                      }`,
                      background:
                        filter === f
                          ? C.gold + "22"
                          : "transparent",
                      color:
                        filter === f
                          ? C.gold
                          : C.muted,
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform:
                        "capitalize",
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* LIST */}

          <div
            style={{
              maxHeight: 320,
              overflowY: "auto",
            }}
          >
            {filtered.length === 0 ? (
              <div
                style={{
                  color: C.muted,
                  fontSize: 13,
                  textAlign: "center",
                  padding: 32,
                }}
              >
                No transactions yet.
                Add one above ↑
              </div>
            ) : (
              filtered.map((e) => (
                <div
                  key={e._id}
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    padding: "10px 0",
                    borderBottom: `1px solid ${C.border}`,
                    gap: 10,
                  }}
                >
                  {/* ICON */}

                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background:
                        C.surface,
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {CAT_ICON[
                      e.category
                    ] || "💳"}
                  </div>

                  {/* DETAILS */}

                  <div
                    style={{
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.text,
                      }}
                    >
                      {e.label}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: C.muted,
                      }}
                    >
                      {e.category} ·{" "}
                      {new Date(
                        e.date
                      ).toLocaleDateString(
                        "en-IN"
                      )}
                    </div>
                  </div>

                  {/* TYPE */}

                  <Pill
                    color={
                      e.type === "need"
                        ? C.green
                        : C.gold
                    }
                  >
                    {e.type}
                  </Pill>

                  {/* AMOUNT */}

                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: C.text,
                      fontFamily:
                        "monospace",
                      minWidth: 80,
                      textAlign:
                        "right",
                    }}
                  >
                    {fmt(
                      e.amount,
                      currency
                    )}
                  </div>

                  {/* DELETE */}

                  <button
                    onClick={() =>
                      del(e._id)
                    }
                    style={{
                      background:
                        "none",
                      border: "none",
                      color: C.muted,
                      cursor: "pointer",
                      fontSize: 14,
                      padding:
                        "0 4px",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}