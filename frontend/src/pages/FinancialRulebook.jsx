import React, { useState, useEffect, useMemo } from "react";
import { getFinancialRules } from "../api";
import RuleCalculator from "../components/RuleCalculators";
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
  PieChart,
  TrendingUp,
  CreditCard,
  Target,
  Quote,
} from "lucide-react";

export default function FinancialRulebook({ C, onNavigate }) {
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [attribution, setAttribution] = useState("Inspired by Morgan Housel, The Psychology of Money");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [expandedRules, setExpandedRules] = useState({});

  useEffect(() => {
    let isMounted = true;
    const fetchRules = async () => {
      try {
        setLoading(true);
        const res = await getFinancialRules();
        if (isMounted && res.data?.success) {
          setRules(res.data.rules || []);
          setCategories(res.data.categories || []);
          if (res.data.attribution) setAttribution(res.data.attribution);
        }
      } catch (err) {
        console.error("Failed to load financial rules:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchRules();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleRule = (ruleId) => {
    setExpandedRules((prev) => ({
      ...prev,
      [ruleId]: !prev[ruleId],
    }));
  };

  const toggleAll = (expand) => {
    const newState = {};
    rules.forEach((r) => {
      newState[r.id] = expand;
    });
    setExpandedRules(newState);
  };

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchesCategory =
        selectedCategory === "ALL" || rule.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        rule.number?.toLowerCase().includes(q) ||
        rule.title?.toLowerCase().includes(q) ||
        rule.tagline?.toLowerCase().includes(q) ||
        rule.explanation?.toLowerCase().includes(q) ||
        rule.formula?.toLowerCase().includes(q) ||
        rule.category?.toLowerCase().includes(q)
      );
    });
  }, [rules, selectedCategory, searchQuery]);

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Financial Protection":
        return <Shield size={16} color="#10B981" />;
      case "Budgeting and Spending":
        return <PieChart size={16} color="#3B82F6" />;
      case "Investments and Wealth Building":
        return <TrendingUp size={16} color="#8B5CF6" />;
      case "Loans and Major Purchases":
        return <CreditCard size={16} color="#F97316" />;
      case "Long-Term Financial Planning":
        return <Target size={16} color="#EC4899" />;
      default:
        return <BookOpen size={16} />;
    }
  };

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "1100px",
        margin: "0 auto",
        color: C?.text || "#D8CBB3",
        fontFamily: "'DM Sans',system-ui,sans-serif",
      }}
    >
      {/* Header Banner */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div
            style={{
              padding: "10px",
              borderRadius: "12px",
              background: `${C?.accent || "#2F6BFF"}20`,
              color: C?.accent || "#2F6BFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
              Financial Rulebook
            </h1>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.92rem", color: C?.muted || "#A8A294" }}>
              28 Essential Personal Finance Rules, Principles, and Interactive Calculators.
            </p>
          </div>
        </div>

        {/* Morgan Housel Attribution Banner */}
        <div
          style={{
            marginTop: "16px",
            padding: "14px 20px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(47, 107, 255, 0.08))",
            border: `1px solid ${C?.border || "#3D3D37"}`,
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Quote size={20} color={C?.warning || "#FBBF24"} />
          <div style={{ fontSize: "0.88rem", fontStyle: "italic", color: C?.text || "#D8CBB3" }}>
            "{attribution}" — Practical guidelines to keep your financial life resilient, rational, and compounding.
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div
        style={{
          background: C?.surface || "#282826",
          border: `1px solid ${C?.border || "#3D3D37"}`,
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "24px",
          boxShadow: C?.shadowSm,
        }}
      >
        {/* Search Bar */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: C?.muted || "#A8A294",
            }}
          />
          <input
            type="text"
            placeholder="Search all 28 rules by keyword, formula, concept (e.g. 'Emergency', '50/30/20', 'Rule of 72')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px 12px 42px",
              borderRadius: "10px",
              background: C?.cardBg || "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${C?.border || "#3D3D37"}`,
              color: C?.text || "#D8CBB3",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
        </div>

        {/* Category Tabs & Expand/Collapse */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: `1px solid ${selectedCategory === "ALL" ? (C?.accent || "#2F6BFF") : (C?.border || "#3D3D37")}`,
                background: selectedCategory === "ALL" ? `${C?.accent || "#2F6BFF"}25` : "transparent",
                color: selectedCategory === "ALL" ? (C?.accent || "#2F6BFF") : (C?.text || "#D8CBB3"),
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              All Rules ({rules.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: `1px solid ${selectedCategory === cat ? (C?.accent || "#2F6BFF") : (C?.border || "#3D3D37")}`,
                  background: selectedCategory === cat ? `${C?.accent || "#2F6BFF"}25` : "transparent",
                  color: selectedCategory === cat ? (C?.accent || "#2F6BFF") : (C?.text || "#D8CBB3"),
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {getCategoryIcon(cat)}
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => toggleAll(true)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: `1px solid ${C?.border || "#3D3D37"}`,
                background: "transparent",
                color: C?.muted || "#A8A294",
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={() => toggleAll(false)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: `1px solid ${C?.border || "#3D3D37"}`,
                background: "transparent",
                color: C?.muted || "#A8A294",
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Rules List / Accordion */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: C?.muted || "#A8A294" }}>
          Loading 28 financial rules...
        </div>
      ) : filteredRules.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px",
            background: C?.surface || "#282826",
            borderRadius: "16px",
            border: `1px solid ${C?.border || "#3D3D37"}`,
            color: C?.muted || "#A8A294",
          }}
        >
          No rules matched your search criteria.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {filteredRules.map((rule) => {
            const isExpanded = Boolean(expandedRules[rule.id]);
            return (
              <div
                key={rule.id}
                style={{
                  background: C?.surface || "#282826",
                  border: `1px solid ${isExpanded ? (C?.accent || "#2F6BFF") + "66" : (C?.border || "#3D3D37")}`,
                  borderRadius: "14px",
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                  boxShadow: isExpanded ? C?.shadowSm : "none",
                }}
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleRule(rule.id)}
                  style={{
                    padding: "18px 22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    userSelect: "none",
                    gap: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1 }}>
                    <span
                      style={{
                        fontSize: "0.88rem",
                        fontWeight: 800,
                        color: C?.accent || "#2F6BFF",
                        background: `${C?.accent || "#2F6BFF"}20`,
                        padding: "4px 10px",
                        borderRadius: "8px",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {rule.number}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>{rule.title}</h3>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: "rgba(255, 255, 255, 0.06)",
                            color: C?.muted || "#A8A294",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {getCategoryIcon(rule.category)}
                          {rule.category}
                        </span>
                        {rule.calculatorType && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "999px",
                              background: `${C?.green || "#4ADE80"}20`,
                              color: C?.green || "#4ADE80",
                            }}
                          >
                            Interactive Calculator
                          </span>
                        )}
                      </div>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: C?.muted || "#A8A294", lineHeight: 1.4 }}>
                        {rule.tagline}
                      </p>
                    </div>
                  </div>

                  <div style={{ color: C?.muted || "#A8A294" }}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div
                    style={{
                      padding: "0 22px 22px 22px",
                      borderTop: `1px solid ${C?.border || "#3D3D37"}`,
                      background: "rgba(0, 0, 0, 0.08)",
                    }}
                  >
                    {/* Explanation & Why it matters */}
                    <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <h4 style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em", color: C?.accent || "#2F6BFF", margin: "0 0 6px 0" }}>
                          Core Principle
                        </h4>
                        <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.55, color: C?.text || "#D8CBB3" }}>
                          {rule.explanation}
                        </p>
                      </div>
                      <div>
                        <h4 style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em", color: C?.warning || "#FBBF24", margin: "0 0 6px 0" }}>
                          Why It Matters
                        </h4>
                        <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.55, color: C?.text || "#D8CBB3" }}>
                          {rule.whyItMatters}
                        </p>
                      </div>
                    </div>

                    {/* Formula & Practical Example */}
                    <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div
                        style={{
                          padding: "12px 16px",
                          borderRadius: "10px",
                          background: C?.cardBg || "rgba(255, 255, 255, 0.02)",
                          border: `1px solid ${C?.border || "#3D3D37"}`,
                        }}
                      >
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C?.muted || "#A8A294" }}>
                          PRACTICAL FORMULA
                        </span>
                        <div style={{ fontSize: "0.88rem", fontWeight: 600, marginTop: "4px", color: C?.accent || "#2F6BFF", fontFamily: "monospace" }}>
                          {rule.formula}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "12px 16px",
                          borderRadius: "10px",
                          background: C?.cardBg || "rgba(255, 255, 255, 0.02)",
                          border: `1px solid ${C?.border || "#3D3D37"}`,
                        }}
                      >
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C?.muted || "#A8A294" }}>
                          REAL-WORLD EXAMPLE (INR)
                        </span>
                        <div style={{ fontSize: "0.84rem", marginTop: "4px", color: C?.text || "#D8CBB3", lineHeight: 1.45 }}>
                          {rule.practicalExample}
                        </div>
                      </div>
                    </div>

                    {/* Assumptions & Quick Navigation */}
                    <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.78rem", color: C?.muted || "#A8A294" }}>
                      <span>📌 <strong>Assumptions:</strong> {rule.assumptions}</span>
                      {rule.featureLink && onNavigate && (
                        <button
                          type="button"
                          onClick={() => onNavigate(rule.featureLink.page)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#3B82F6",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {rule.featureLink.label} <ExternalLink size={13} />
                        </button>
                      )}
                    </div>

                    {/* Embedded Interactive Calculator */}
                    {rule.calculatorType && (
                      <RuleCalculator
                        type={rule.calculatorType}
                        C={C}
                        onNavigate={onNavigate}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
