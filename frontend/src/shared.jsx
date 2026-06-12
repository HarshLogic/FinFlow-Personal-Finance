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

// ── Badge Components ──────────────────────────────────────────────────────────
export function BadgeCard({ badge, isEarned = true }) {
  return (
    <div style={{
      background: isEarned ? C.card : C.surface,
      border: `1px solid ${isEarned ? C.gold + "44" : C.border}`,
      borderRadius: 12, padding: "14px 16px",
      textAlign: "center", minWidth: 100,
      opacity: isEarned ? 1 : 0.5,
      transition: "all 0.3s ease",
      cursor: "pointer",
    }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{badge.icon}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: isEarned ? C.gold : C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {badge.title}
      </div>
      <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
        {isEarned && badge.earnedAt && new Date(badge.earnedAt).toLocaleDateString()}
      </div>
    </div>
  );
}

export function BadgeShowcase({ badges = [], loading = false, error = null }) {
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} />;

  const categories = {
    savings: badges.filter(b => b.category === "savings"),
    spending: badges.filter(b => b.category === "spending"),
    investing: badges.filter(b => b.category === "investing"),
    consistency: badges.filter(b => b.category === "consistency"),
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {Object.entries(categories).map(([cat, items]) => 
        items.length > 0 && (
          <div key={cat}>
            <div style={{ 
              fontSize: 12, fontWeight: 600, color: C.muted, 
              textTransform: "uppercase", letterSpacing: "0.05em",
              marginBottom: 12,
            }}>
              {cat} ({items.length})
            </div>
            <div style={{
              display: "flex", gap: 12, flexWrap: "wrap",
            }}>
              {items.map((badge) => (
                <div key={badge.badgeId} title={badge.description}>
                  <BadgeCard badge={badge} isEarned={true} />
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {badges.length === 0 && (
        <div style={{ 
          textAlign: "center", padding: "32px 20px",
          color: C.muted, fontSize: 14,
        }}>
          🎯 No badges earned yet. Start saving to unlock achievements!
        </div>
      )}
    </div>
  );
}

export function BadgeProgress({ milestones = [], loading = false, error = null }) {
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {milestones.length === 0 ? (
        <div style={{ 
          textAlign: "center", padding: "20px",
          color: C.muted, fontSize: 12,
        }}>
          ✨ All milestones unlocked!
        </div>
      ) : (
        milestones.slice(0, 3).map((m) => (
          <div key={m.threshold} style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "12px 14px",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 8,
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                {m.icon} {m.title}
              </span>
              <span style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>
                {fmtLakh(m.current)} / {fmtLakh(m.threshold)}
              </span>
            </div>
            <div style={{
              width: "100%", height: 6, background: C.card,
              borderRadius: 3, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", background: C.gold,
                width: `${Math.min(m.progress, 100)}%`,
                transition: "width 0.3s ease",
              }} />
            </div>
            <div style={{
              fontSize: 10, color: C.muted, marginTop: 6,
              textAlign: "right",
            }}>
              {fmtLakh(m.remaining)} to next milestone
            </div>
          </div>
        ))
      )}
    </div>
  );
}