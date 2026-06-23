// ── Design Tokens ─────────────────────────────────────────────────────────────
export const C = {
  bg:      "#0D0F14",
  surface: "#13161D",
  card:    "#181C26",
  border:  "#232840",
  gold:    "#D4A843",
  goldDim: "#8A6C28",
  green:   "#22C55E",
  red:     "#EF4444",
  blue:    "#60A5FA",
  purple:  "#A78BFA",
  text:    "#F1F0EC",
  muted:   "#7A7F93",
  accent:  "#1A2035",
};

// ── Formatters ────────────────────────────────────────────────────────────────
export const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);

export const pct = (v, t) => (t === 0 ? "0.0" : ((v / t) * 100).toFixed(1));

export const fmtLakh = (n) => {
  const abs = Math.abs(n);
  if (abs >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000)   return `₹${(n / 100000).toFixed(2)}L`;
  if (abs >= 1000)     return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${Math.round(n)}`;
};

// ── Shared UI Atoms ───────────────────────────────────────────────────────────
export function Pill({ children, color = C.gold }) {
  return (
    <span style={{
      background: color + "22", color,
      border: `1px solid ${color}44`,
      fontSize: 11, padding: "2px 8px",
      borderRadius: 20, fontWeight: 600,
      letterSpacing: "0.05em", textTransform: "uppercase",
    }}>{children}</span>
  );
}

export function MetricCard({ label, value, sub, subColor, icon }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: "18px 20px",
      display: "flex", flexDirection: "column", gap: 6,
      flex: 1, minWidth: 155,
    }}>
      <div style={{ fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>} {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: "monospace", letterSpacing: "-0.5px" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: subColor || C.muted }}>{sub}</div>}
    </div>
  );
}

export function SectionTitle({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 3, height: 18, background: C.gold, borderRadius: 4 }} />
      <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: "0.02em" }}>
        {children}
      </span>
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 48 }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        border: `3px solid ${C.border}`,
        borderTop: `3px solid ${C.gold}`,
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div style={{
      background: "#EF444422", border: `1px solid #EF444466`,
      borderRadius: 12, padding: "16px 20px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <span style={{ color: "#EF4444", fontSize: 13 }}>⚠ {message}</span>
      {onRetry && (
        <button onClick={onRetry} style={{
          background: "#EF444422", border: `1px solid #EF444466`,
          color: "#EF4444", borderRadius: 8, padding: "6px 14px",
          cursor: "pointer", fontSize: 12, fontWeight: 600,
        }}>Retry</button>
      )}
    </div>
  );
}

// ── Category Icons ────────────────────────────────────────────────────────────
export const CAT_ICON = {
  Food: "🛒", Travel: "🚗", Utilities: "⚡", Shopping: "🛍️",
  Health: "💊", Dining: "🍽️", Rent: "🏠", Education: "📚",
  OTT: "📺", Savings: "🏦", Other: "💳",
};

export const CATEGORIES = Object.keys(CAT_ICON);