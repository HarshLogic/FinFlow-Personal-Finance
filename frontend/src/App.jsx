import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import ExpenseTracker from "./pages/ExpenseTracker";
import Portfolio from "./pages/Portfolio";
import WealthProjection from "./pages/WealthProjection";
import { C } from "./shared";

const NAV = [
  { id: "dashboard", icon: "⬡", label: "Dashboard" },
  { id: "expenses", icon: "◈", label: "Expense Track" },
  { id: "portfolio", icon: "◉", label: "Portfolio" },
  { id: "projection", icon: "◎", label: "Projections" },
];

const TITLES = {
  dashboard: "Financial Overview",
  expenses: "Expense Tracker",
  portfolio: "Portfolio Manager",
  projection: "Wealth Projections",
};

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const PageComponent = {
    dashboard: Dashboard,
    expenses: ExpenseTracker,
    portfolio: Portfolio,
    projection: WealthProjection,
  }[page];

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "'DM Sans',system-ui,sans-serif", color: C.text, overflow: "hidden" }}>
      <aside style={{ width: collapsed ? 64 : 220, flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: "20px 0", transition: "width 0.25s ease", overflow: "hidden" }}>
        <div style={{ padding: "0 16px 24px", borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: C.gold, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, fontWeight: 800, color: "#0D0F14" }}>₹</div>
            {!collapsed && <div><div style={{ fontSize: 13, fontWeight: 800, color: C.text, lineHeight: 1 }}>FinFlow</div><div style={{ fontSize: 10, color: C.muted }}>Personal Finance</div></div>}
          </div>
        </div>
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, padding: "0 8px" }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left", width: "100%", background: page === n.id ? C.gold + "22" : "transparent",
              transform: page === n.id ? "scale(1.02)" : "scale(1)",
              boxShadow: page === n.id
                ? "0 0 12px rgba(240, 223, 20, 0.35)"
                : "none", color: page === n.id ? C.gold : C.muted, borderLeft: page === n.id ? `3px solid ${C.gold}` : "3px solid transparent", transition: "all 0.15s"
            }}>
              <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{n.icon}</span>
              {!collapsed && <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{n.label}</span>}
            </button>
          ))}
        </nav>
        <button onClick={() => setCollapsed(p => !p)} style={{ margin: "16px 8px 0", padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {collapsed ? "▶" : "◀"}
        </button>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ padding: "16px 28px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surface, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{TITLES[page]}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ fontSize: 12, color: C.muted, background: C.card, border: `1px solid ${C.border}`, padding: "6px 14px", borderRadius: 20 }}>🟢 Live</div>
            <div style={{ width: 36, height: 36, background: C.gold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#0D0F14" }}>U</div>
          </div>
        </header>
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          <PageComponent />
        </main>
      </div>
    </div>
  );
}