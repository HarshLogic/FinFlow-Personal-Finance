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
  Plus,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

export const NAV_GROUPS = [
  {
    group: "Workspace",
    items: [
      { id: "dashboard", icon: <LayoutDashboard size={18} strokeWidth={1.8} />, label: "Overview" },
      { id: "expenses", icon: <Receipt size={18} strokeWidth={1.8} />, label: "Transactions" },
    ],
  },
  {
    group: "Wealth",
    items: [
      { id: "portfolio", icon: <Briefcase size={18} strokeWidth={1.8} />, label: "Portfolio" },
      { id: "projection", icon: <TrendingUp size={18} strokeWidth={1.8} />, label: "Projections" },
      { id: "planner", icon: <LineChart size={18} strokeWidth={1.8} />, label: "Invest Planner" },
    ],
  },
  {
    group: "Financial Intelligence",
    items: [
      { id: "affordability", icon: <ShoppingCart size={18} strokeWidth={1.8} />, label: "Can I Afford It?" },
      { id: "ca-report", icon: <FileText size={18} strokeWidth={1.8} />, label: "Monthly CA Report" },
      { id: "milestones", icon: <ShieldCheck size={18} strokeWidth={1.8} />, label: "Milestones" },
      { id: "rulebook", icon: <BookOpen size={18} strokeWidth={1.8} />, label: "Rulebook" },
    ],
  },
];

export const NAV = NAV_GROUPS.flatMap((g) => g.items);

const TITLES = {
  dashboard: "Financial Overview",
  expenses: "Expense Tracker",
  portfolio: "Portfolio Manager",
  projection: "Wealth Projections",
  planner: "Investment Planner",
  "ca-report": "Monthly Personal CA Report",
  affordability: "Can I Afford It? Purchase Simulator",
  milestones: "Financial Milestones & Foundation",
  rulebook: "Financial Rulebook (28 Rules)",
  profile: "User Profile & Settings",
};

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);
  const [showMobileAction, setShowMobileAction] = useState(false);

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
    document.documentElement.style.backgroundColor =
      themes[theme]?.bg || (theme === "dark" ? "#0D1117" : "#F5F7FA");
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
    affordability: PurchaseSimulator,
    milestones: FinancialMilestones,
    rulebook: FinancialRulebook,
  }[page] || Dashboard;

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
      {/* ── 1. LOGGED OUT VIEW: SHOWS LANDING PAGE ── */}
      {!user && <LandingPage />}

      {/* ── 2. LOGGED IN VIEW: REVOLUT / LINEAR INSPIRED APP EXPERIENCE ── */}
      {user && (
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            minHeight: "100vh",
            background: C.bg,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
            color: C.text,
            overflowX: "hidden",
            transition: "background 0.25s ease, color 0.25s ease",
          }}
        >
          {/* ── DESKTOP GROUPED SIDEBAR ── */}
          {!isMobile && (
            <aside
              style={{
                width: collapsed ? 72 : 240,
                height: "100vh",
                flexShrink: 0,
                background: C.surface,
                borderRight: `1px solid ${C.border}`,
                display: "flex",
                flexDirection: "column",
                transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
                overflow: "hidden",
                zIndex: 20,
              }}
            >
              {/* Brand Header */}
              <div
                style={{
                  padding: "20px 16px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "space-between",
                  borderBottom: `1px solid ${C.border}`,
                  minHeight: 64,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img
                    src="/logo.png"
                    alt="FinFlow"
                    style={{
                      height: 32,
                      width: 32,
                      objectFit: "contain",
                      borderRadius: 8,
                    }}
                  />
                  {!collapsed && (
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        color: C.text,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Fin<span style={{ color: C.accent }}>Flow</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setCollapsed(!collapsed)}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: C.muted,
                    cursor: "pointer",
                    padding: 4,
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
              </div>

              {/* Grouped Navigation Links */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px 10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                {NAV_GROUPS.map((grp) => (
                  <div key={grp.group} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {!collapsed && (
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: C.muted,
                          padding: "0 10px 4px",
                          userSelect: "none",
                        }}
                      >
                        {grp.group}
                      </div>
                    )}
                    {grp.items.map((item) => {
                      const isActive = page === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setPage(item.id)}
                          title={collapsed ? item.label : undefined}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: collapsed ? "10px 0" : "9px 12px",
                            justifyContent: collapsed ? "center" : "flex-start",
                            borderRadius: 8,
                            border: "none",
                            cursor: "pointer",
                            width: "100%",
                            background: isActive
                              ? C.accentMuted || "rgba(16, 185, 129, 0.14)"
                              : "transparent",
                            color: isActive ? C.accent : C.muted,
                            fontWeight: isActive ? 600 : 500,
                            fontSize: 13,
                            transition: "all 0.15s ease",
                            borderLeft: isActive ? `3px solid ${C.accent}` : "3px solid transparent",
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                            {item.icon}
                          </span>
                          {!collapsed && (
                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {item.label}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Sidebar Footer: Profile & Logout */}
              <div
                style={{
                  padding: "12px 10px",
                  borderTop: `1px solid ${C.border}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <button
                  onClick={() => setPage("profile")}
                  title={collapsed ? "User Profile" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: collapsed ? "10px 0" : "8px 12px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    borderRadius: 8,
                    border: `1px solid ${page === "profile" ? C.accent : "transparent"}`,
                    background: page === "profile" ? C.card : "transparent",
                    color: page === "profile" ? C.accent : C.text,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    width: "100%",
                  }}
                >
                  <User size={16} />
                  {!collapsed && <span>Profile & Settings</span>}
                </button>
                <button
                  onClick={logout}
                  title={collapsed ? "Logout" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: collapsed ? "10px 0" : "8px 12px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    borderRadius: 8,
                    border: `1px solid ${C.error}33`,
                    background: `${C.error}12`,
                    color: C.error,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    width: "100%",
                  }}
                >
                  <LogOut size={16} />
                  {!collapsed && <span>Logout</span>}
                </button>
              </div>
            </aside>
          )}

          {/* ── MAIN CONTENT CONTAINER ── */}
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
            {/* Top Navigation Bar */}
            <header
              style={{
                padding: isMobile ? "12px 16px" : "14px 28px",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: C.surface,
                flexShrink: 0,
                transition: "background 0.25s ease, border-color 0.25s ease",
                gap: 12,
              }}
            >
              {isMobile ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img
                    src="/logo.png"
                    alt="FinFlow"
                    style={{ height: 28, width: 28, objectFit: "contain", borderRadius: 6 }}
                  />
                  <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: C.text }}>
                    {TITLES[page] || "FinFlow"}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>
                    {TITLES[page] || "Dashboard"}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    {new Date().toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              )}

              {/* Desktop Header Controls */}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  aria-label="Currency Selector"
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.card,
                    color: C.text,
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="GBP">£ GBP</option>
                </select>

                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  aria-label="Toggle Theme"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.card,
                    color: C.text,
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {theme === "dark" ? <Sun size={14} color="#FBBF24" /> : <Moon size={14} color="#60A5FA" />}
                  <span style={{ display: isMobile ? "none" : "inline" }}>
                    {theme === "dark" ? "Light" : "Dark"}
                  </span>
                </button>
              </div>
            </header>

            {/* Scrollable Page Body */}
            <main
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                maxWidth: "100%",
                padding: isMobile ? "16px 14px 96px" : "24px 28px 40px",
              }}
            >
              <PageComponent C={C} currency={currency} setPage={setPage} />
            </main>
          </div>

          {/* ── MOBILE NATIVE BOTTOM NAVIGATION BAR ── */}
          {isMobile && (
            <nav
              aria-label="Mobile Navigation"
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                height: "calc(64px + env(safe-area-inset-bottom, 0px))",
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
                zIndex: 40,
                background: C.surface,
                borderTop: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                boxShadow: "0 -4px 16px rgba(0,0,0,0.12)",
              }}
            >
              {/* 1. Home */}
              <button
                onClick={() => setPage("dashboard")}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: page === "dashboard" ? C.accent : C.muted,
                  padding: "6px 12px",
                }}
              >
                <LayoutDashboard size={20} strokeWidth={page === "dashboard" ? 2.2 : 1.8} />
                <span style={{ fontSize: 10, fontWeight: page === "dashboard" ? 700 : 500 }}>Home</span>
              </button>

              {/* 2. Activity / Expenses */}
              <button
                onClick={() => setPage("expenses")}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: page === "expenses" ? C.accent : C.muted,
                  padding: "6px 12px",
                }}
              >
                <Receipt size={20} strokeWidth={page === "expenses" ? 2.2 : 1.8} />
                <span style={{ fontSize: 10, fontWeight: page === "expenses" ? 700 : 500 }}>Activity</span>
              </button>

              {/* 3. Center Highlighted Add Button */}
              <button
                onClick={() => setShowMobileAction(true)}
                aria-label="Quick Financial Actions"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: C.accent,
                  color: C.accentForeground || "#FFFFFF",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
                  transform: "translateY(-6px)",
                }}
              >
                <Plus size={24} strokeWidth={2.4} />
              </button>

              {/* 4. Wealth / Portfolio */}
              <button
                onClick={() => setPage("portfolio")}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: page === "portfolio" ? C.accent : C.muted,
                  padding: "6px 12px",
                }}
              >
                <Briefcase size={20} strokeWidth={page === "portfolio" ? 2.2 : 1.8} />
                <span style={{ fontSize: 10, fontWeight: page === "portfolio" ? 700 : 500 }}>Wealth</span>
              </button>

              {/* 5. More Menu Drawer */}
              <button
                onClick={() => setShowMobileMore(true)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: showMobileMore ? C.accent : C.muted,
                  padding: "6px 12px",
                }}
              >
                <Menu size={20} strokeWidth={1.8} />
                <span style={{ fontSize: 10, fontWeight: 500 }}>More</span>
              </button>
            </nav>
          )}

          {/* ── MOBILE QUICK ACTION SHEET ── */}
          {isMobile && showMobileAction && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 60,
                background: "rgba(0,0,0,0.6)",
                display: "flex",
                alignItems: "flex-end",
              }}
              onClick={() => setShowMobileAction(false)}
            >
              <div
                style={{
                  width: "100%",
                  background: C.surface,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  borderTop: `1px solid ${C.border}`,
                  padding: "20px 20px calc(24px + env(safe-area-inset-bottom, 0px))",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Quick Actions</div>
                  <button
                    onClick={() => setShowMobileAction(false)}
                    style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer" }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    setPage("expenses");
                    setShowMobileAction(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    borderRadius: 12,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    color: C.text,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <Receipt size={18} color={C.accent} />
                  <span>Log New Expense / Transaction</span>
                </button>

                <button
                  onClick={() => {
                    setPage("affordability");
                    setShowMobileAction(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    borderRadius: 12,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    color: C.text,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <ShoppingCart size={18} color={C.blue} />
                  <span>Can I Afford It? Simulator</span>
                </button>

                <button
                  onClick={() => {
                    setPage("ca-report");
                    setShowMobileAction(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    borderRadius: 12,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    color: C.text,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <FileText size={18} color={C.gold} />
                  <span>Generate Monthly CA Report</span>
                </button>
              </div>
            </div>
          )}

          {/* ── MOBILE MORE DRAWER / SHEET ── */}
          {isMobile && showMobileMore && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 60,
                background: "rgba(0,0,0,0.6)",
                display: "flex",
                alignItems: "flex-end",
              }}
              onClick={() => setShowMobileMore(false)}
            >
              <div
                style={{
                  width: "100%",
                  maxHeight: "80vh",
                  overflowY: "auto",
                  background: C.surface,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  borderTop: `1px solid ${C.border}`,
                  padding: "20px 20px calc(24px + env(safe-area-inset-bottom, 0px))",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>All Navigation & Services</div>
                  <button
                    onClick={() => setShowMobileMore(false)}
                    style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer" }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Section: Wealth */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>
                    Wealth & Projections
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button
                      onClick={() => {
                        setPage("projection");
                        setShowMobileMore(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: page === "projection" ? C.accentMuted : C.card,
                        border: `1px solid ${page === "projection" ? C.accent : C.border}`,
                        color: page === "projection" ? C.accent : C.text,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <TrendingUp size={16} />
                      <span>Wealth Projections</span>
                    </button>
                    <button
                      onClick={() => {
                        setPage("planner");
                        setShowMobileMore(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: page === "planner" ? C.accentMuted : C.card,
                        border: `1px solid ${page === "planner" ? C.accent : C.border}`,
                        color: page === "planner" ? C.accent : C.text,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <LineChart size={16} />
                      <span>Investment Planner</span>
                    </button>
                  </div>
                </div>

                {/* Section: Financial Intelligence */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>
                    Financial Intelligence
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button
                      onClick={() => {
                        setPage("affordability");
                        setShowMobileMore(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: page === "affordability" ? C.accentMuted : C.card,
                        border: `1px solid ${page === "affordability" ? C.accent : C.border}`,
                        color: page === "affordability" ? C.accent : C.text,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <ShoppingCart size={16} />
                      <span>Can I Afford It? Simulator</span>
                    </button>
                    <button
                      onClick={() => {
                        setPage("ca-report");
                        setShowMobileMore(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: page === "ca-report" ? C.accentMuted : C.card,
                        border: `1px solid ${page === "ca-report" ? C.accent : C.border}`,
                        color: page === "ca-report" ? C.accent : C.text,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <FileText size={16} />
                      <span>Monthly Personal CA Report</span>
                    </button>
                    <button
                      onClick={() => {
                        setPage("milestones");
                        setShowMobileMore(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: page === "milestones" ? C.accentMuted : C.card,
                        border: `1px solid ${page === "milestones" ? C.accent : C.border}`,
                        color: page === "milestones" ? C.accent : C.text,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <ShieldCheck size={16} />
                      <span>Financial Milestones & Foundation</span>
                    </button>
                    <button
                      onClick={() => {
                        setPage("rulebook");
                        setShowMobileMore(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: page === "rulebook" ? C.accentMuted : C.card,
                        border: `1px solid ${page === "rulebook" ? C.accent : C.border}`,
                        color: page === "rulebook" ? C.accent : C.text,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <BookOpen size={16} />
                      <span>Financial Rulebook (28 Rules)</span>
                    </button>
                  </div>
                </div>

                {/* Section: Profile & Preferences */}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                  <button
                    onClick={() => {
                      setPage("profile");
                      setShowMobileMore(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: page === "profile" ? C.accentMuted : C.card,
                      border: `1px solid ${page === "profile" ? C.accent : C.border}`,
                      color: page === "profile" ? C.accent : C.text,
                      fontSize: 13,
                      fontWeight: 600,
                      width: "100%",
                      cursor: "pointer",
                      marginBottom: 8,
                    }}
                  >
                    <User size={16} />
                    <span>User Profile & Settings</span>
                  </button>

                  <button
                    onClick={logout}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: `${C.error}12`,
                      border: `1px solid ${C.error}33`,
                      color: C.error,
                      fontSize: 13,
                      fontWeight: 600,
                      width: "100%",
                      cursor: "pointer",
                    }}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── AI CHATBOT TRIGGER CIRCLE ── */}
          {!isChatOpen && (
            <div
              onClick={() => setIsChatOpen(true)}
              style={{
                position: "fixed",
                bottom: isMobile ? "calc(76px + env(safe-area-inset-bottom, 0px))" : 24,
                right: isMobile ? 16 : 24,
                width: 48,
                height: 48,
                borderRadius: "50%",
                overflow: "hidden",
                boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 35,
                border: `2px solid ${C.accent}`,
              }}
              title="FinFlow Financial AI Assistant"
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
