// frontend/src/App.jsx
import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import ExpenseTracker from "./pages/ExpenseTracker";
import Portfolio from "./pages/Portfolio";
import WealthProjection from "./pages/WealthProjection";
import InvestmentPlanner from "./pages/InvestmentPlanner";
import UserProfile from "./pages/UserProfile";
import LandingPage from "./pages/LandingPage";
import MonthlyCAReport from "./pages/MonthlyCAReport";
import PurchaseSimulator from "./pages/PurchaseSimulator";
import FinancialMilestones from "./pages/FinancialMilestones";
import FinancialRulebook from "./pages/FinancialRulebook";
import Chatbot from "./components/Chatbot";
import OnboardingModal from "./components/OnboardingModal";
import { themes, common } from "./shared";
import { getFinancialFoundation } from "./api";

// We use SignedIn and SignedOut directly from Clerk
import { useAuth } from "./context/AuthContext";

import {
  LayoutDashboard,
  Receipt,
  Briefcase,
  TrendingUp,
  LineChart,
  User,
  FileText,
  ShoppingCart,
  ShieldCheck,
  BookOpen,
} from "lucide-react";


const NAV = [
  { id: "dashboard", icon: <LayoutDashboard size={20} strokeWidth={1.5} />, label: "Dashboard" },
  { id: "expenses", icon: <Receipt size={20} strokeWidth={1.5} />, label: "Expense Track" },
  { id: "portfolio", icon: <Briefcase size={20} strokeWidth={1.5} />, label: "Portfolio" },
  { id: "projection", icon: <TrendingUp size={20} strokeWidth={1.5} />, label: "Projections" },
  { id: "planner", icon: <LineChart size={20} strokeWidth={1.5} />, label: "Invest Planner" },
  { id: "ca-report", icon: <FileText size={20} strokeWidth={1.5} />, label: "Monthly CA Report" },
  { id: "affordability", icon: <ShoppingCart size={20} strokeWidth={1.5} />, label: "Can I Afford It?" },
  { id: "milestones", icon: <ShieldCheck size={20} strokeWidth={1.5} />, label: "Milestones" },
  { id: "rulebook", icon: <BookOpen size={20} strokeWidth={1.5} />, label: "Rulebook" },
];

const TITLES = {
  dashboard: "Financial Overview",
  expenses: "Expense Tracker",
  portfolio: "Portfolio Manager",
  projection: "Wealth Projections",
  planner: "Investment Planner",
  "ca-report": "Monthly Personal CA Report",
  "affordability": "Can I Afford It? Purchase Simulator",
  milestones: "Financial Milestones & Foundation",
  rulebook: "Financial Rulebook (28 Rules)",
};

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [currency, setCurrency] = useState(localStorage.getItem("currency") || "INR");
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.backgroundColor = themes[theme]?.bg || (theme === "dark" ? "#1E1E1C" : "#F3EEE3");
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  const C = { ...themes[theme], ...common };

  const PageComponent = {
    dashboard: Dashboard,
    expenses: ExpenseTracker,
    portfolio: Portfolio,
    projection: WealthProjection,
    planner: InvestmentPlanner,
    profile: UserProfile,
    "ca-report": MonthlyCAReport,
    "affordability": PurchaseSimulator,
    milestones: FinancialMilestones,
    rulebook: FinancialRulebook,
  }[page];

  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (user) {
      getFinancialFoundation()
        .then((res) => {
          if (res.data?.data?.onboarding?.status === "NOT_STARTED") {
            setShowOnboarding(true);
          }
        })
        .catch((err) => {
          console.error("Failed to check onboarding state:", err);
        });
    }
  }, [user]);

  if (loading) return <div style={{ color: "white", padding: 20 }}>Loading...</div>;

  return (
    <>
      {/* ── 1. LOGGED OUT VIEW: SHOWS YOUR LANDING PAGE ── */}
      {!user && (
        <LandingPage />
      )}

      {/* ── 2. LOGGED IN VIEW: SHOWS YOUR EXISTING DASHBOARD ── */}
      {user && (
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
        >
          <aside
            style={{
              width: isMobile ? "100%" : collapsed ? 64 : 220,
              height: isMobile ? "auto" : "100vh",
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
            <div
              style={{
                padding: isMobile ? "0 10px" : "0 16px 24px",
                borderBottom: `1px solid ${C.border}`,
                marginBottom: isMobile ? 0 : 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img 
                  src="/logo.png" 
                  alt="Finance Flow" 
                  style={{ 
                    height: collapsed ? 36 : 48, 
                    width: collapsed ? 36 : "auto", 
                    objectFit: "cover",
                    objectPosition: "left",
                    transition: "all 0.25s"
                  }} 
                />
              </div>
            </div>
            <nav
              style={{
                flex: 1,
                display: "flex",
                flexDirection: isMobile ? "row" : "column",
                flexWrap: "wrap",
                justifyContent: isMobile ? "center" : "flex-start",
                gap: 4,
              }}
            >
              {NAV.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setPage(n.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    width: isMobile ? "auto" : "100%",
                    background: page === n.id ? C.accentMuted || (theme === "dark" ? "rgba(47, 107, 255, 0.14)" : "rgba(217, 84, 30, 0.12)") : "transparent",
                    color: page === n.id ? C.accent : C.muted,
                    borderLeft: page === n.id ? `3px solid ${C.accent}` : "3px solid transparent",
                    transition: "all 0.18s ease",
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{n.icon}</span>
                  {!collapsed && (
                    <span style={{ fontSize: 13, fontWeight: page === n.id ? 700 : 500, whiteSpace: "nowrap" }}>
                      {n.label}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            {!isMobile && (
              <button
                onClick={() => setCollapsed((p) => !p)}
                style={{
                  margin: "16px 8px 0",
                  padding: 10,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: "transparent",
                  color: C.muted,
                  cursor: "pointer",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {collapsed ? "☰" : "✕"}
              </button>
            )}
          </aside>

          <div
            style={{
              flex: 1,
              width: "100%",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <header
              style={{
                padding: isMobile ? "12px" : "16px 28px",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "space-between",
                alignItems: "center",
                background: C.surface,
                flexShrink: 0,
                transition: "all 0.3s ease",
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{TITLES[page]}</div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {new Date().toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    background: C.card,
                    color: C.text,
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="GBP">£ GBP</option>
                </select>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    background: C.card,
                    color: C.text,
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  {theme === "dark" ? "☀ Light" : "🌙 Dark"}
                </button>
                <button
                  onClick={() => setPage("profile")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: page === "profile" ? (theme === "dark" ? "#FFFFFF" : "#FFFFFF") : C.text,
                    background: page === "profile" ? C.accent : C.card,
                    border: `1px solid ${page === "profile" ? C.accent : C.border}`,
                    padding: "7px 14px",
                    borderRadius: 10,
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <User size={15} />
                  User Profile
                </button>
                {/* ── CUSTOM USER BUTTON ── */}
                <button 
                  onClick={logout} 
                  style={{ 
                    padding: "7px 14px", 
                    borderRadius: 10, 
                    border: `1px solid ${C.error}33`, 
                    background: `${C.error}15`, 
                    color: C.error, 
                    cursor: "pointer", 
                    fontSize: "13px", 
                    fontWeight: 600,
                    transition: "all 0.2s ease"
                  }}
                >
                  Logout
                </button>
              </div>
            </header>

            <main
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                maxWidth: "100%",
                padding: isMobile ? "12px" : "24px 28px",
              }}
            >
              <PageComponent C={C} currency={currency} setPage={setPage} />
            </main>
          </div>

          {isMobile && (
            <nav
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                height: 60,
                zIndex: 30,
                background: C.surface,
                borderTop: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "stretch",
              }}
            >
              {NAV.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setPage(n.id)}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: page === n.id ? C.accent : C.muted,
                    borderTop: page === n.id ? `2px solid ${C.accent}` : "2px solid transparent",
                    transition: "all 0.15s ease",
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

          {/* ── AI AGENT PLACEHOLDER CIRCLE ── */}
          {!isChatOpen && (
            <div
              onClick={() => setIsChatOpen(true)}
              style={{
                position: "fixed",
                bottom: isMobile ? 80 : 30,
                right: 30,
                width: 50,
                height: 50,
                borderRadius: "50%",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 9999,
              }}
              title="AI Agent"
            >
              <img src="/chatbot.jpg" alt="AI Agent" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          
          <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} C={C} />
          <OnboardingModal
            isOpen={showOnboarding}
            onClose={() => setShowOnboarding(false)}
            onCompleted={() => setShowOnboarding(false)}
            C={C}
          />
        </div>
      )}
    </>
  );
}