import { useState } from "react";
import { CATEGORIES } from "../shared";
import { parseSMS, quickAddExpense } from "../api";
import { Sparkles, AlertCircle, X } from "lucide-react";

export default function QuickPasteModal({ C, currency, isOpen, onClose, onSaved, accounts = [] }) {
  const [smsText, setSmsText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");

  const [form, setForm] = useState({
    amount: "",
    merchant: "",
    label: "",
    category: "Food",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "UPI",
    type: "need",
    accountId: "",
    notes: "",
    externalReference: "",
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState("");

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!smsText.trim()) {
      setParseError("Please paste an SMS or transaction message.");
      return;
    }
    setParsing(true);
    setParseError("");
    setDuplicateWarning("");

    try {
      const res = await parseSMS(smsText);
      const data = res.data?.data;
      if (data) {
        setForm({
          amount: data.amount || "",
          merchant: data.merchant || "",
          label: data.merchant ? `${data.merchant} expense` : "Expense",
          category: data.category || "Food",
          date: data.date || new Date().toISOString().split("T")[0],
          paymentMethod: data.paymentMethod || "UPI",
          type: "need",
          accountId: accounts[0]?._id || "",
          notes: data.externalReference ? `Ref: ${data.externalReference}` : "",
          externalReference: data.externalReference || "",
        });

        if (data.isDuplicate) {
          setDuplicateWarning(data.duplicateReason || "Warning: Potential duplicate transaction detected!");
        }
      }
    } catch (err) {
      setParseError(err.response?.data?.error || "Failed to parse SMS. Please check format.");
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      setSaveError("Valid amount is required.");
      return;
    }
    setSaving(true);
    setSaveError("");

    try {
      await quickAddExpense({
        ...form,
        amount: Number(form.amount),
        source: "SMS_PASTE",
        saveMapping: true,
        force: Boolean(duplicateWarning),
      });

      // Clear & close
      setSmsText("");
      onSaved();
      onClose();
    } catch (err) {
      setSaveError(err.response?.data?.error || "Failed to save transaction.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 18,
          width: "100%",
          maxWidth: 540,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 24,
          boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: C.gold + "22", color: C.gold, padding: 6, borderRadius: 8 }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                Quick Add with SMS Parser
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>
                Paste bank debit SMS or UPI confirmation to auto-fill
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: C.muted,
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Paste Area */}
        <div style={{ marginBottom: 16 }}>
          <textarea
            rows={3}
            placeholder="e.g. Rs.450.00 debited from your account via UPI to Swiggy on 15-11-2026. Ref: 4321..."
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: C.card,
              color: C.text,
              fontSize: 13,
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ fontSize: 11, color: C.muted }}>
              Supports HDFC, SBI, ICICI, Axis, Paytm, PhonePe, GPay, etc.
            </span>
            <button
              type="button"
              onClick={handleParse}
              disabled={parsing || !smsText.trim()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 8,
                border: "none",
                background: C.accent || C.gold,
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: 12,
                cursor: parsing ? "not-allowed" : "pointer",
                opacity: parsing ? 0.7 : 1,
              }}
            >
              <Sparkles size={14} />
              {parsing ? "Parsing..." : "Parse Transaction"}
            </button>
          </div>

          {parseError && (
            <div style={{ color: C.red, fontSize: 12, marginTop: 6 }}>
              ⚠ {parseError}
            </div>
          )}
        </div>

        {/* Duplicate Warning */}
        {duplicateWarning && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              background: C.gold + "15",
              border: `1px solid ${C.gold}44`,
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 16,
              color: C.gold,
              fontSize: 12,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Duplicate Alert: </strong>
              {duplicateWarning}
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                You can still save if you wish to record this again.
              </div>
            </div>
          </div>
        )}

        {/* Parsed / Review Form */}
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                Amount (₹) *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.card,
                  color: C.text,
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "monospace",
                }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                Merchant / Payee
              </label>
              <input
                type="text"
                value={form.merchant}
                onChange={(e) => setForm({ ...form, merchant: e.target.value, label: `${e.target.value} expense` })}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.card,
                  color: C.text,
                  fontSize: 13,
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.card,
                  color: C.text,
                  fontSize: 13,
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.card,
                  color: C.text,
                  fontSize: 13,
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                Payment Method
              </label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.card,
                  color: C.text,
                  fontSize: 13,
                }}
              >
                <option value="UPI">UPI</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="NETBANKING">Net Banking</option>
                <option value="WALLET">Wallet</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                Deduct From Account
              </label>
              <select
                value={form.accountId}
                onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.card,
                  color: C.text,
                  fontSize: 13,
                }}
              >
                <option value="">No account (Ledger only)</option>
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name} ({acc.type} - ₹{acc.currentBalance})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
              Expense Type (50-30-20 Rule)
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <label
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1px solid ${form.type === "need" ? C.green : C.border}`,
                  background: form.type === "need" ? C.green + "15" : C.card,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: form.type === "need" ? C.green : C.muted,
                }}
              >
                <input
                  type="radio"
                  name="type"
                  value="need"
                  checked={form.type === "need"}
                  onChange={() => setForm({ ...form, type: "need" })}
                />
                Need (Essential)
              </label>

              <label
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1px solid ${form.type === "want" ? C.gold : C.border}`,
                  background: form.type === "want" ? C.gold + "15" : C.card,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: form.type === "want" ? C.gold : C.muted,
                }}
              >
                <input
                  type="radio"
                  name="type"
                  value="want"
                  checked={form.type === "want"}
                  onChange={() => setForm({ ...form, type: "want" })}
                />
                Want (Discretionary)
              </label>
            </div>
          </div>

          {saveError && (
            <div style={{ color: C.red, fontSize: 12 }}>
              ⚠ {saveError}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px",
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
                padding: "10px",
                borderRadius: 8,
                border: "none",
                background: C.accent || C.gold,
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: 13,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving..." : "Save Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
