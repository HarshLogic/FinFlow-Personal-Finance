import { useState } from "react";
import { fmt, SectionTitle } from "../shared";
import { createAccount, deleteAccount } from "../api";
import { Landmark, Plus, Trash2, Wallet, CreditCard, Banknote } from "lucide-react";

export default function AccountsWidget({ C, currency, accounts = [], onRefresh }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "CHECKING",
    currentBalance: "",
    isLiquid: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.currentBalance === "") {
      setError("Please fill name and balance");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await createAccount({
        name: form.name.trim(),
        type: form.type,
        currentBalance: Number(form.currentBalance),
        isLiquid: form.isLiquid,
      });
      setShowAdd(false);
      setForm({ name: "", type: "CHECKING", currentBalance: "", isLiquid: true });
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add account");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return;
    try {
      await deleteAccount(id);
      onRefresh();
    } catch (err) {
      alert("Failed to delete account: " + (err.response?.data?.error || err.message));
    }
  };

  const getAccountIcon = (type) => {
    switch (type) {
      case "CHECKING":
        return <Landmark size={18} color={C.blue} />;
      case "SAVINGS":
        return <Landmark size={18} color={C.green} />;
      case "WALLET":
        return <Wallet size={18} color={C.gold} />;
      case "CASH":
        return <Banknote size={18} color={C.purple} />;
      default:
        return <CreditCard size={18} color={C.muted} />;
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
        <SectionTitle C={C}>Connected Accounts & Liquid Cash</SectionTitle>
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
          <Plus size={14} /> Add Account
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
        {accounts.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "16px 0" }}>
            No accounts configured yet. Add your bank accounts or wallets to automate liquid balance tracking!
          </div>
        ) : (
          accounts.map((acc) => (
            <div
              key={acc._id}
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
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {getAccountIcon(acc.type)}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                    {acc.name}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {acc.type} {acc.isLiquid ? "· Liquid" : ""}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: C.text,
                    fontFamily: "monospace",
                  }}
                >
                  {fmt(acc.currentBalance, currency)}
                </div>

                <button
                  onClick={() => handleDelete(acc._id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: C.muted,
                    cursor: "pointer",
                    padding: 4,
                  }}
                  title="Delete account"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

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
              maxWidth: 380,
              padding: 24,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>
              Add New Account
            </div>

            {error && (
              <div style={{ background: C.red + "22", color: C.red, padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 10 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                  Account Name (e.g. HDFC Salary, PayTM Wallet)
                </label>
                <input
                  type="text"
                  placeholder="HDFC Bank"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                  Account Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text }}
                >
                  <option value="CHECKING">Checking / Salary Account</option>
                  <option value="SAVINGS">Savings Account</option>
                  <option value="WALLET">Digital Wallet (PayTM, PhonePe)</option>
                  <option value="CASH">Physical Cash</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                  Current Balance (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="25000"
                  value={form.currentBalance}
                  onChange={(e) => setForm({ ...form, currentBalance: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text }}
                  required
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="isLiquid"
                  checked={form.isLiquid}
                  onChange={(e) => setForm({ ...form, isLiquid: e.target.checked })}
                />
                <label htmlFor="isLiquid" style={{ fontSize: 12, color: C.text, cursor: "pointer" }}>
                  Include in Liquid Cash (Safe-to-Spend calculations)
                </label>
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
                  {loading ? "Adding..." : "Add Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
