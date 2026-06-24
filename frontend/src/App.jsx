import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import ExpenseTracker from "./pages/ExpenseTracker";
import Portfolio from "./pages/Portfolio";
import WealthProjection from "./pages/WealthProjection";
import { themes, common } from "./shared";

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

// Breakpoint for mobile
// const MOBILE_BP = 640;

// const [isMobile, setIsMobile] = useState(window.innerWidth < 768);


export default function App() {
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
  };

  window.addEventListener("resize", handleResize);

  return () => window.removeEventListener("resize", handleResize);
}, []);

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
  localStorage.setItem("theme", theme);
}, [theme]);

const C = {
  ...themes[theme],
  ...common,
};

  const PageComponent = {
    dashboard: Dashboard,
    expenses: ExpenseTracker,
    portfolio: Portfolio,
    projection: WealthProjection,
  }[page];

  return (
<div
  style={{
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    minHeight: "100vh",
    background: C.bg,
    fontFamily: "'DM Sans',system-ui,sans-serif",
    color: C.text,
    overflowX: "hidden",
    transition: "all 0.3s ease",
  }}
>  <aside
  style={{
    width: isMobile ? "100%" : collapsed ? 64 : 220,

    height:
      isMobile
        ? "auto"
        : "100vh",

    flexShrink: 0,
    background: C.surface,
    borderRight: `1px solid ${C.border}`,
    display: "flex",
    flexDirection: isMobile ? "row" : "column",
    padding: "20px 0",
    transition: "width 0.25s ease",
    overflow: "hidden",
  }}
>
        <div style={{ padding: isMobile ? "0 10px" : "0 16px 24px", borderBottom: `1px solid ${C.border}`, marginBottom: isMobile ? 0 : 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            

<div style={{ width: 36, height: 36, background: C.gold, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, fontWeight: 800, color: "#0D0F14" }}>₹</div>
            {!collapsed && <div><div style={{ fontSize: 13, fontWeight: 800, color: C.text, lineHeight: 1 }}>FinFlow</div><div style={{ fontSize: 10, color: C.muted }}>Personal Finance</div></div>}
          </div>
        </div>
        <nav
  style={{
    flex: 1,
    display: "flex",
    flexDirection:
      isMobile
        ? "row"
        : "column",
    flexWrap: "wrap",
     justifyContent: isMobile ? "center" : "flex-start",
    gap: 4,
  }}
>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left", width: isMobile ? "auto" : "100%", background: page === n.id ? C.gold + "22" : "transparent",
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
        {!isMobile && (
        <button onClick={() => setCollapsed(p => !p)} style={{ margin: "16px 8px 0", padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
    {collapsed ? "☰" : "✕"}    </button>
        )}
      </aside>
       <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", overflow: "hidden",}}
>
        <header style={{padding: isMobile ? "12px" : "16px 28px" , borderBottom: `1px solid ${C.border}`, display: "flex",     flexDirection: isMobile ? "column" : "row",
                        justifyContent: "space-between", alignItems: "center", background: C.surface, flexShrink: 0 ,transition: "all 0.3s ease",gap: 10 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{TITLES[page]}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
  style={{
    padding: "8px 12px",
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: C.card,
    color: C.text,
    cursor: "pointer",
    fontSize: 13,
  }}
>
  {theme === "dark" ? "☀ Light" : "🌙 Dark"}
</button>
            <div style={{ fontSize: 12, color: C.muted, background: C.card, border: `1px solid ${C.border}`, padding: "6px 14px", borderRadius: 20 }}>🟢 Live</div>
            <div style={{ width: 36, height: 36, background: C.gold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#0D0F14" }}>U</div>
          </div>
        </header>
        <main style={{ flex: 1, overflowY: "auto",     padding: isMobile ? "12px" : "24px 28px",
 }}>
          <PageComponent C={C}/>
        </main>
      </div>


      {/* ── Mobile Bottom Tab Bar ── */}
      {isMobile && (
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          height: 60, zIndex: 30,
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          display: "flex", alignItems: "stretch",
        }}>
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 3,
                border: "none", background: "transparent",
                cursor: "pointer",
                color: page === n.id ? C.gold : C.muted,
                borderTop: page === n.id ? `2px solid ${C.gold}` : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{n.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.03em" }}>
                {n.label.split(" ")[0]}
              </span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}