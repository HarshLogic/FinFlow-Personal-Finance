import { useState } from "react";
import { fmt, SectionTitle } from "../shared";
import { createSplit, settleSplit, deleteSplit } from "../api";
import { Plus, CheckCircle, Trash2, ArrowDownLeft } from "lucide-react";

export default function WhoOwesMeWidget({
  C,
  currency,
  splits = [],
  splitsSummary,
  onRefresh,
  accounts = [],
}) {
  const [filter, setFilter] = useState("PENDING");
  const [showAdd, setShowAdd] = useState(false);
  const [settleTarget, setSettleTarget] = useState(null);

  const [addForm, setAddForm] = useState({
    borrowerName: "",
    amount: "",
    dueDate: "",
    notes: "",
  });

  const [settleForm, setSettleForm] = useState({
    amount: "",
    accountId: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalPending = splitsSummary?.totalPending || 0;

  const filteredSplits = splits.filter((s) => {
    if (filter === "PENDING") return s.status === "PENDING" || s.status === "PARTIAL";
    if (filter === "SETTLED") return s.status === "SETTLED";
    return true;
  });

  const handleAddSplit = async (e) => {
    e.preventDefault();
    if (!addForm.borrowerName.trim() || !addForm.amount || Number(addForm.amount) <= 0) {
      setError("Please provide a borrower name and valid amount.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await createSplit({
        borrowerName: addForm.borrowerName.trim(),
        amount: Number(addForm.amount),
        dueDate: addForm.dueDate || undefined,
        notes: addForm.notes.trim(),
      });
      setShowAdd(false);
      setAddForm({ borrowerName: "", amount: "", dueDate: "", notes: "" });
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add split");
    } finally {
      setLoading(false);
    }
  };

  const openSettleModal = (split) => {
    setSettleTarget(split);
    const remaining = Math.max(0, (split.amount || 0) - (split.settledAmount || 0));
    setSettleForm({
      amount: remaining,
      accountId: accounts[0]?._id || "",
      notes: "Settled repayment",
    });
    setError("");
  };

  const handleSettle = async (e) => {
    e.preventDefault();
    if (!settleTarget) return;
    setLoading(true);
    setError("");

    try {
      await settleSplit(settleTarget._id, {
        amount: Number(settleForm.amount),
        accountId: settleForm.accountId || undefined,
        notes: settleForm.notes,
      });
      setSettleTarget(null);
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to record settlement");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSplit = async (id) => {
    if (!window.confirm("Are you sure you want to delete this debt record?")) return;
    try {
      await deleteSplit(id);
      onRefresh();
    } catch (err) {
      alert("Failed to delete split: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: 20,
        flex: 1,
        minWidth: 280,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SectionTitle C={C}>Who Owes Me</SectionTitle>

        <button
          onClick={() => { setShowAdd(true); setError(""); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "5px 10px",
            borderRadius: 8,
            border: `1px solid ${C.gold}44`,
            background: C.gold + "15",
            color: C.gold,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <Plus size={14} /> Add Split
        </button>
      </div>

      {/* Summary Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          borderRadius: 10,
          background: C.surface,
          border: `1px solid ${C.border}`,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase" }}>
            Total Pending Receivables
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: totalPending > 0 ? C.gold : C.green,
              fontFamily: "monospace",
            }}
          >
            {fmt(totalPending, currency)}
          </div>
        </div>

        {/* Filter buttons */}
        <div style={{ display: "flex", gap: 6 }}>
          {["PENDING", "ALL"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                border: "none",
                background: filter === f ? C.gold + "22" : "transparent",
                color: filter === f ? C.gold : C.muted,
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {f === "PENDING" ? "Pending" : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Debts List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 240, overflowY: "auto" }}>
        {filteredSplits.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            {filter === "PENDING" ? "No pending debts! All settled up." : "No splits recorded yet."}
          </div>
        ) : (
          filteredSplits.map((item) => {
            const amt = item.amount || 0;
            const settled = item.settledAmount || 0;
            const remaining = Math.max(0, amt - settled);
            const isSettled = item.status === "SETTLED" || remaining === 0;

            return (
              <div
                key={item._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: C.surface,
                  border: `1px solid ${isSettled ? C.green + "44" : C.border}`,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                    {item.borrowerName}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {isSettled
                      ? `Fully settled (${fmt(amt, currency)})`
                      : `Owes ${fmt(remaining, currency)} of ${fmt(amt, currency)}`}
                  </div>
                  {item.notes && (
                    <div style={{ fontSize: 10, color: C.muted, fontStyle: "italic", marginTop: 2 }}>
                      {item.notes}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {!isSettled && (
                    <button
                      onClick={() => openSettleModal(item)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "5px 8px",
                        borderRadius: 6,
                        border: `1px solid ${C.green}44`,
                        background: C.green + "22",
                        color: C.green,
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                      title="Record repayment"
                    >
                      <ArrowDownLeft size={12} /> Settle
                    </button>
                  )}

                  {isSettled && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: C.green,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <CheckCircle size={11} /> Settled
                    </span>
                  )}

                  <button
                    onClick={() => handleDeleteSplit(item._id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: C.muted,
                      cursor: "pointer",
                      padding: 4,
                    }}
                    title="Delete split"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Split Modal */}
      {showAdd && (
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
              maxWidth: 400,
              padding: 24,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>
              Record Bill Split / Debt
            </div>

            {error && (
              <div style={{ background: C.red + "22", color: C.red, padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 10 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleAddSplit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                  Friend / Borrower Name *
                </label>
                <input
                  type="text"
                  placeholder="Rahul, Aman, Priya"
                  value={addForm.borrowerName}
                  onChange={(e) => setAddForm({ ...addForm, borrowerName: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                  Amount Owed (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="1000"
                  value={addForm.amount}
                  onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                  Optional Due Date
                </label>
                <input
                  type="date"
                  value={addForm.dueDate}
                  onChange={(e) => setAddForm({ ...addForm, dueDate: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                  Notes (e.g. Dinner bill split)
                </label>
                <input
                  type="text"
                  placeholder="Restaurant bill share"
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  style={{ flex: 1, padding: 9, borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ flex: 1, padding: 9, borderRadius: 8, border: "none", background: C.gold, color: "#0D0F14", fontWeight: 700, cursor: "pointer" }}
                >
                  {loading ? "Saving..." : "Save Split"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Modal */}
      {settleTarget && (
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
              maxWidth: 380,
              padding: 24,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>
              Record Repayment
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
              From <strong style={{ color: C.text }}>{settleTarget.borrowerName}</strong>
            </div>

            {error && (
              <div style={{ background: C.red + "22", color: C.red, padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 10 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSettle} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                  Repayment Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={settleForm.amount}
                  onChange={(e) => setSettleForm({ ...settleForm, amount: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text }}
                  required
                />
              </div>

              {accounts.length > 0 && (
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                    Deposit Into Account
                  </label>
                  <select
                    value={settleForm.accountId}
                    onChange={(e) => setSettleForm({ ...settleForm, accountId: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text }}
                  >
                    <option value="">None / Manual ledger only</option>
                    {accounts.map(acc => (
                      <option key={acc._id} value={acc._id}>
                        {acc.name} ({acc.type} - ₹{acc.currentBalance})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setSettleTarget(null)}
                  style={{ flex: 1, padding: 9, borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ flex: 1, padding: 9, borderRadius: 8, border: "none", background: C.green, color: "#0D0F14", fontWeight: 700, cursor: "pointer" }}
                >
                  {loading ? "Recording..." : "Confirm Repayment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
