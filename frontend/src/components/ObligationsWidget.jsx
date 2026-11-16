import { useState } from "react";
import { fmt, SectionTitle, CAT_ICON } from "../shared";
import { createObligation, payObligation, deleteObligation } from "../api";
import { Plus, Check, Trash2, Calendar, CheckCircle2, Clock } from "lucide-react";

export default function ObligationsWidget({ C, currency, obligationsData = [], onRefresh, accounts = [] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showPayModal, setShowPayModal] = useState(null);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    dueDay: 5,
    category: "Utilities",
    frequency: "MONTHLY",
    accountId: "",
  });
  const [payForm, setPayForm] = useState({
    accountId: "",
    amount: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const items = obligationsData.items || [];
  const totalAmount = obligationsData.total || 0;
  const paidAmount = obligationsData.paid || 0;
  const pendingAmount = obligationsData.remaining || 0;
  const progressPct = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.dueDay) {
      setError("Please fill all required fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createObligation({
        title: form.title,
        amount: Number(form.amount),
        dueDay: Number(form.dueDay),
        category: form.category,
        frequency: form.frequency,
        accountId: form.accountId || undefined,
      });
      setShowAdd(false);
      setForm({ title: "", amount: "", dueDay: 5, category: "Utilities", frequency: "MONTHLY", accountId: "" });
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add obligation");
    } finally {
      setLoading(false);
    }
  };

  const openPay = (ob) => {
    setShowPayModal(ob);
    setPayForm({
      accountId: accounts[0]?._id || "",
      amount: ob.remaining > 0 ? ob.remaining : ob.amount,
    });
    setError("");
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!showPayModal) return;
    setLoading(true);
    setError("");
    try {
      await payObligation(showPayModal.id, {
        amount: Number(payForm.amount),
        accountId: payForm.accountId || undefined,
      });
      setShowPayModal(null);
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this recurring obligation?")) return;
    try {
      await deleteObligation(id);
      onRefresh();
    } catch (err) {
      alert("Failed to delete obligation: " + (err.response?.data?.error || err.message));
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
        <SectionTitle C={C}>Monthly Fixed Bills</SectionTitle>
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
          <Plus size={14} /> Add Bill
        </button>
      </div>

      {/* Progress & Stats */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
        }}
      >
        <div>
          <span style={{ color: C.muted }}>Paid: </span>
          <span style={{ fontWeight: 700, color: C.green, fontFamily: "monospace" }}>
            {fmt(paidAmount, currency)}
          </span>
        </div>
        <div>
          <span style={{ color: C.muted }}>Pending: </span>
          <span style={{ fontWeight: 700, color: C.red, fontFamily: "monospace" }}>
            {fmt(pendingAmount, currency)}
          </span>
        </div>
        <div style={{ fontWeight: 700, color: C.text, fontFamily: "monospace" }}>
          {progressPct}% Done
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${progressPct}%`,
            background: progressPct === 100 ? C.green : C.gold,
            borderRadius: 4,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* List of Obligations */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4, maxHeight: 260, overflowY: "auto" }}>
        {items.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            No recurring bills added yet. Track your rent, subscriptions, or EMIs!
          </div>
        ) : (
          items.map((ob) => {
            const isPaid = ob.isFullyPaid;
            const icon = CAT_ICON[ob.category] || "📄";

            return (
              <div
                key={ob.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: isPaid ? C.surface : C.surface,
                  border: `1px solid ${isPaid ? C.green + "44" : C.border}`,
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.text,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {ob.title}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
                      <Calendar size={11} />
                      Due on {ob.dueDay}th of month
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "monospace" }}>
                      {fmt(ob.amount, currency)}
                    </div>
                    {isPaid ? (
                      <span style={{ fontSize: 10, color: C.green, fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>
                        <CheckCircle2 size={10} /> Paid
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, color: C.red, fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>
                        <Clock size={10} /> Pending
                      </span>
                    )}
                  </div>

                  {!isPaid && (
                    <button
                      onClick={() => openPay(ob)}
                      style={{
                        background: C.green + "22",
                        border: `1px solid ${C.green}44`,
                        color: C.green,
                        borderRadius: 6,
                        padding: "5px 8px",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                      title="Mark as paid"
                    >
                      <Check size={12} /> Pay
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(ob.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: C.muted,
                      cursor: "pointer",
                      padding: 4,
                    }}
                    title="Delete obligation"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
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
              Add Recurring Obligation
            </div>

            {error && (
              <div style={{ background: C.red + "22", color: C.red, padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 10 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                  Bill Title (e.g. House Rent, WiFi, Netflix)
                </label>
                <input
                  type="text"
                  placeholder="Rent, Electricity, Gym"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1500"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                    Due Day (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={form.dueDay}
                    onChange={(e) => setForm({ ...form, dueDay: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text }}
                >
                  <option value="Utilities">Utilities (⚡ Bills, Gas, Net)</option>
                  <option value="Rent">Rent (🏠 Housing)</option>
                  <option value="OTT">OTT (📺 Netflix, Spotify)</option>
                  <option value="Education">Education (📚 Fees, Courses)</option>
                  <option value="Health">Health (💊 Insurance, Gym)</option>
                  <option value="Other">Other</option>
                </select>
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
                  {loading ? "Adding..." : "Add Obligation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && (
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
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>
              Record Bill Payment
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
              Payment for <strong style={{ color: C.text }}>{showPayModal.title}</strong>
            </div>

            {error && (
              <div style={{ background: C.red + "22", color: C.red, padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 10 }}>
                {error}
              </div>
            )}

            <form onSubmit={handlePay} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text }}
                  required
                />
              </div>

              {accounts.length > 0 && (
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                    Deduct From Account
                  </label>
                  <select
                    value={payForm.accountId}
                    onChange={(e) => setPayForm({ ...payForm, accountId: e.target.value })}
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
                  onClick={() => setShowPayModal(null)}
                  style={{ flex: 1, padding: 9, borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ flex: 1, padding: 9, borderRadius: 8, border: "none", background: C.green, color: "#0D0F14", fontWeight: 700, cursor: "pointer" }}
                >
                  {loading ? "Recording..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
