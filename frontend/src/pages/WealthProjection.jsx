import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getProjection } from "../api";
import { MetricCard, SectionTitle, Spinner, ErrorBox } from "../shared";

export default function WealthProjection({ C }) {
  const [monthly, setMonthly] = useState(20000);
  const [rate,    setRate]    = useState(12);
  const [years,   setYears]   = useState(20);
  const [data,    setData]    = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
    
  

const load = useCallback(async () => {
  setLoading(true); 
  setError(null);

  try {
    const { data: res } = await getProjection({ monthly, rate, years });

    setData(res.projection.map(p => ({
      year: `Y${p.year}`,
      corpus: Math.round(p.corpus / 100000),
      invested: Math.round(p.invested / 100000),
    })));

    setSummary(res.summary);

  } catch (e) {
    console.log("FULL ERROR:", e);

    if (e.response) {
      setError(`Error ${e.response.status}: ${e.response.data?.error || "Server error"}`);
    } else if (e.request) {
      setError("No response from server (is backend running?)");
    } else {
      setError(e.message);
    }

  } finally {
    setLoading(false);
  }
}, [monthly, rate, years]); 

  // debounce — wait 400ms after slider stops
  useEffect(() => {
  const t = setTimeout(() => {
    load();
  }, 400);

  return () => clearTimeout(t);
}, [load]);

  const sliders = [
    { label: "Monthly SIP",      key: "monthly", val: monthly, set: setMonthly, min: 1000,  max: 100000, step: 1000, disp: v => `₹${(v/1000).toFixed(0)}k` },
    { label: "Expected Return %", key: "rate",    val: rate,    set: setRate,    min: 4,     max: 24,     step: 0.5,  disp: v => `${v}%` },
    { label: "Time Horizon",      key: "years",   val: years,   set: setYears,   min: 1,     max: 40,     step: 1,    disp: v => `${v} yrs` },
  ];

  // Milestone years shown below chart
  const milestones = [5, 10, 15, 20].filter(y => y <= years);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%", padding: "10px", boxSizing: "border-box", }}>
      {/* Metrics */}
        <div
  style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, width: "100%",}}>
       <MetricCard C={C} icon="🚀" label="Projected Corpus" subColor={C.gold} value={summary ? `₹${(summary.finalCorpus / 100000).toFixed(1)}L` : "—"} sub={`In ${years} years`} />
        <MetricCard C={C} icon="💵" label="Total Invested"
          value={summary ? `₹${(summary.totalInvested / 100000).toFixed(1)}L` : "—"}
          sub={`₹${(monthly/1000).toFixed(0)}k/month`} />
        <MetricCard C={C} icon="✨" label="Wealth Created" subColor={C.green}
          value={summary ? `₹${(summary.wealthCreated / 100000).toFixed(1)}L` : "—"}
          sub={summary ? `${summary.multiplier}× multiplier` : ""} />
      </div>

      {error && <ErrorBox C={C} message={error} onRetry={load} />}

      {/* Sliders */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "clamp(12px, 3vw, 20px)" }}>
        <SectionTitle C={C}>Projection Parameters</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {sliders.map(s => (
            <div key={s.key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: C.muted }}>{s.label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.gold, fontFamily: "monospace" }}>
                  {s.disp(s.val)}
                </span>
              </div>
              <input type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                onChange={e => s.set(Number(e.target.value))}
                style={{ width: "100%", accentColor: C.gold, cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginTop: 3 }}>
                <span>{s.disp(s.min)}</span>
                <span>{s.disp(s.max)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "clamp(12px, 3vw, 20px)", overflowX: "auto"}}>
        <SectionTitle C={C}>Wealth Growth Curve</SectionTitle>
        {loading ? <Spinner C={C} /> : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="gCorpus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.gold}  stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.gold}  stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.blue}  stopOpacity={0.15} />
                    <stop offset="95%" stopColor={C.blue}  stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="year" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false}
                  interval={Math.floor(years / 8)} />
                <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${v}L`} />
                <Tooltip
                  formatter={(v, name) => [`₹${(v * 100000).toLocaleString("en-IN")}`, name === "corpus" ? "Projected Corpus" : "Amount Invested"]}
                  contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text }} />
                <Area type="monotone" dataKey="corpus"   stroke={C.gold} fill="url(#gCorpus)" strokeWidth={2.5} name="corpus" />
                <Area type="monotone" dataKey="invested" stroke={C.blue} fill="url(#gInv)"    strokeWidth={1.5} strokeDasharray="5 3" name="invested" />
              </AreaChart>
            </ResponsiveContainer>

            {/* Milestones */}
            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              {milestones.map(y => {
                const point = data.find(d => d.year === `Y${y}`);
                return (
                  <div key={y} style={{ background: C.accent, borderRadius: 10, padding: "10px 14px", flex: "1 1 150px", minWidth: "120px", maxWidth: "100%" }}>
                    <div style={{ fontSize: 11, color: C.muted }}>At {y} years</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.gold, fontFamily: "monospace" }}>
                      {point ? `₹${(point.corpus).toFixed(1)}L` : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}