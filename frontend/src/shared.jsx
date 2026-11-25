// ── Centralized FinFlow Design System & Theme Tokens ──────────────────────────

export const common = {
  // Brand accents & core semantics
  gold: "#2F6BFF",       // Mapped to brand accent for backwards-compatibility
  goldDim: "#1E55E0",
  blue: "#2F6BFF",
  green: "#4ADE80",
  red: "#F87171",
  purple: "#A78BFA",
  radius: {
    xs: 4,
    sm: 6,
    md: 10,
    lg: 14,
    xl: 16,
    full: 9999,
  },
  shadow: {
    subtle: "0 1px 3px rgba(0,0,0,0.06)",
    card: "0 2px 8px rgba(0,0,0,0.08)",
    elevated: "0 12px 24px rgba(0,0,0,0.18)",
    modal: "0 20px 48px rgba(0,0,0,0.32)",
  },
  transitions: {
    fast: "all 0.15s ease",
    default: "all 0.25s ease",
    slow: "all 0.4s ease",
  },
};

export const themes = {
  dark: {
    name: "dark",
    // Primary Brand Colors
    charcoal: "#1E1E1C",
    sand: "#D8CBB3",
    electricBlue: "#2F6BFF",

    // Surfaces & Backgrounds
    bg: "#1E1E1C",            // Charcoal Page Background
    card: "#282826",          // Card Background
    surface: "#30302D",       // Elevated Surface
    elevated: "#30302D",

    // Typography
    text: "#D8CBB3",          // Sand Primary Text
    textSecondary: "#A8A294", // Secondary Text
    muted: "#A8A294",

    // Accents & Borders
    primary: "#2F6BFF",       // Electric Blue Brand Accent
    accent: "#2F6BFF",
    accentHover: "#1E55E0",
    accentForeground: "#FFFFFF",
    accentMuted: "rgba(47, 107, 255, 0.14)",
    gold: "#2F6BFF",          // Seamless legacy mapping to primary accent
    goldDim: "#1E55E0",
    border: "#3D3D37",        // Subtle Border
    borderSubtle: "#2C2C29",
    borderFocus: "#2F6BFF",

    // Status Semantics
    green: "#4ADE80",
    success: "#4ADE80",
    red: "#F87171",
    error: "#F87171",
    danger: "#F87171",
    warning: "#FBBF24",
    yellow: "#FBBF24",
    blue: "#2F6BFF",
    purple: "#A78BFA",

    // Charting Palette
    chart: {
      primary: "#2F6BFF",     // Electric Blue
      secondary: "#4ADE80",   // Success Green
      tertiary: "#D8CBB3",    // Sand Neutral
      quaternary: "#FBBF24", // Warning Gold
      accent: "#A78BFA",      // Purple
      grid: "#3D3D37",
      tooltipBg: "#30302D",
    },

    ...common,
  },

  light: {
    name: "light",
    // Primary Brand Colors
    cream: "#F3EEE3",
    inkBlack: "#111111",
    burntOrange: "#D9541E",

    // Surfaces & Backgrounds
    bg: "#F3EEE3",            // Cream Page Background
    card: "#FAF7F0",          // Card Background
    surface: "#FFFFFF",       // Elevated Surface
    elevated: "#FFFFFF",

    // Typography
    text: "#111111",          // Ink Black Primary Text
    textSecondary: "#746D63", // Secondary Text
    muted: "#746D63",

    // Accents & Borders
    primary: "#D9541E",       // Burnt Orange Brand Accent
    accent: "#D9541E",
    accentHover: "#B84314",
    accentForeground: "#FFFFFF",
    accentMuted: "rgba(217, 84, 30, 0.12)",
    gold: "#D9541E",          // Seamless legacy mapping to primary accent
    goldDim: "#B84314",
    border: "#DDD5C6",        // Subtle Border
    borderSubtle: "#EAE3D6",
    borderFocus: "#D9541E",

    // Status Semantics
    green: "#15803D",
    success: "#15803D",
    red: "#B91C1C",
    error: "#B91C1C",
    danger: "#B91C1C",
    warning: "#92400E",
    yellow: "#92400E",
    blue: "#2563EB",
    purple: "#7C3AED",

    // Charting Palette
    chart: {
      primary: "#D9541E",     // Burnt Orange
      secondary: "#15803D",   // Deep Green
      tertiary: "#111111",    // Ink Black
      quaternary: "#92400E", // Warm Amber
      accent: "#7C3AED",      // Violet
      grid: "#DDD5C6",
      tooltipBg: "#FFFFFF",
    },

    ...common,
  },
};

// ── Formatters ────────────────────────────────────────────────────────────────
export const fmt = (n, currency = "INR") => {
  const rates = {
    INR: 1,
    USD: 0.012,
    GBP: 0.0086,
  };

  const locales = {
    INR: "en-IN",
    USD: "en-US",
    GBP: "en-GB",
  };

  const converted = Number(n || 0) * (rates[currency] || 1);

  return new Intl.NumberFormat(locales[currency] || "en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 0,
  }).format(converted);
};

export const pct = (v, t) => (t === 0 ? "0.0" : ((v / t) * 100).toFixed(1));

export const fmtLakh = (n) => {
  const abs = Math.abs(n);
  if (abs >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000)   return `₹${(n / 100000).toFixed(2)}L`;
  if (abs >= 1000)     return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${Math.round(n)}`;
};

// ── Shared UI Atoms ───────────────────────────────────────────────────────────
export function Pill({ C, children, color }) {
  const pillColor = color || C.accent || C.gold;

  return (
    <span
      style={{
        background: pillColor + "18",
        color: pillColor,
        border: `1px solid ${pillColor}33`,
        fontSize: 11,
        padding: "3px 9px",
        borderRadius: 20,
        fontWeight: 600,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {children}
    </span>
  );
}

export function MetricCard({ C, label, value, sub, subColor, icon }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        flex: 1,
        minWidth: 0,
        width: "100%",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        transition: "border-color 0.2s ease, transform 0.2s ease",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: C.muted,
          display: "flex",
          alignItems: "center",
          gap: 6,
          letterSpacing: "0.01em",
        }}
      >
        {icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>}
        {label}
      </div>

      <div
        style={{
          fontSize: "clamp(18px, 3.5vw, 24px)",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          fontWeight: 700,
          color: C.text,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>

      {sub && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: subColor || C.muted,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export function SectionTitle({ C, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div
        style={{
          width: 3,
          height: 16,
          background: C.accent || C.gold,
          borderRadius: 3,
        }}
      />
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: C.text,
          letterSpacing: "0.01em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </span>
    </div>
  );
}

export function Spinner({ C = themes.dark, size = 32, color }) {
  const borderCol = C?.border || "#3D3D37";
  const spinnerColor = color || C?.accent || C?.gold || "#2F6BFF";
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 24 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: `2.5px solid ${borderCol}`,
          borderTop: `2.5px solid ${spinnerColor}`,
          animation: "spin 0.75s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function ErrorBox({ C, message, onRetry }) {
  const errCol = C?.error || C?.red || "#F87171";
  return (
    <div
      style={{
        background: `${errCol}15`,
        border: `1px solid ${errCol}33`,
        borderRadius: 12,
        padding: "14px 18px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        gap: 12,
      }}
    >
      <span style={{ color: errCol, fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>
        ⚠ {message}
      </span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: `${errCol}22`,
            border: `1px solid ${errCol}55`,
            color: errCol,
            borderRadius: 8,
            padding: "5px 12px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ── Category Icons & Constants ────────────────────────────────────────────────
export const CAT_ICON = {
  Food: "🛒",
  Travel: "🚗",
  Utilities: "⚡",
  Shopping: "🛍️",
  Health: "💊",
  Dining: "🍽️",
  Rent: "🏠",
  Education: "📚",
  OTT: "📺",
  Savings: "🏦",
  Other: "💳",
};

export const CATEGORIES = Object.keys(CAT_ICON);
