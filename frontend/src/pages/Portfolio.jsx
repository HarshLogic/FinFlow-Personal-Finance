import { useState, useEffect } from "react";
import {
  getStocks, createStock, deleteStock, updateCMP,
  getMF, createMF, deleteMF,
  getFDs, createFD, deleteFD,
  getLiquid, updateLiquid,
} from "../api";
import { C, fmt, MetricCard, SectionTitle, Pill, Spinner, ErrorBox } from "../shared";

// ── helpers ───────────────────────────────────────────────────────────────────
function fdCalc(fd) {
  const n   = fd.tenure / 12;
  const compoundsPerYear = 4;
  const mat = Math.round(
    fd.principal *
      Math.pow(1 + fd.rate / (100 * compoundsPerYear), compoundsPerYear * n),
  );
  return { mat, int: mat - fd.principal };
}

function AddRow({ fields, onAdd, saving }) {
  const [vals, setVals] = useState(() => Object.fromEntries(fields.map(f => [f.key, f.default ?? ""])));
  const set = (k, v) => setVals(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 16 }}>
      {fields.map(f => f.options ? (
        <select key={f.key} value={vals[f.key]} onChange={e => set(f.key, e.target.value)}
          style={{ padding: "8px 10px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }}>
          {f.options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input key={f.key} type={f.type || "text"} placeholder={f.placeholder}
          value={vals[f.key]} onChange={e => set(f.key, e.target.value)}
          style={{ width: f.width || 120, padding: "8px 10px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, outline: "none" }} />
      ))}
      <button onClick={() => { onAdd(vals); setVals(Object.fromEntries(fields.map(f => [f.key, f.default ?? ""]))); }}
        disabled={saving}
        style={{ padding: "8px 18px", background: saving ? C.goldDim : C.gold, color: "#0D0F14", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: saving ? "not-allowed" : "pointer" }}>
        {saving ? "…" : "+ Add"}
      </button>
    </div>
  );
}

// ── Stocks Tab ────────────────────────────────────────────────────────────────
function StocksTab() {
  const [stocks,  setStocks]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const [cmpEdit, setCmpEdit] = useState({});

  const load = async () => {
    setLoading(true);
    try { const { data } = await getStocks(); setStocks(data); }
    catch (e) { setError(e.response?.data?.error || "Failed to load stocks"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const add = async (vals) => {
    if (!vals.ticker || !vals.qty || !vals.avgPrice) return;
    setSaving(true);
    try {
      const { data } = await createStock({
        ticker: vals.ticker.toUpperCase(), qty: Number(vals.qty),
        avgPrice: Number(vals.avgPrice), cmp: Number(vals.avgPrice),
        sector: vals.sector || "Others",
      });
      setStocks(p => [...p, data]);
    } catch (e) { setError(e.response?.data?.error || "Failed to add stock"); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    try { await deleteStock(id); setStocks(p => p.filter(s => s._id !== id)); }
    catch (e) { setError(e.response?.data?.error || "Delete failed"); }
  };

  const saveCMP = async (id, cmp) => {
    const cmpValue = Number(cmp);
    if (!Number.isFinite(cmpValue) || cmpValue <= 0) {
      setError("CMP must be a positive number");
      return;
    }
    try {
      const { data } = await updateCMP(id, cmpValue);
      setStocks(p => p.map(s => s._id === id ? data : s));
      setCmpEdit(p => { const n = { ...p }; delete n[id]; return n; });
    } catch (e) { setError("CMP update failed"); }
  };

  const stockVal  = stocks.reduce((s, st) => s + st.qty * (st.cmp || 0), 0);
  const stockCost = stocks.reduce((s, st) => s + st.qty * st.avgPrice,   0);
  const stockPL   = stockVal - stockCost;

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && <ErrorBox message={error} onRetry={load} />}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <MetricCard icon="📈" label="Stock Value"    value={fmt(stockVal)}  />
        <MetricCard icon="💵" label="Invested"        value={fmt(stockCost)} />
        <MetricCard icon="🎯" label="Total P&L"       value={fmt(stockPL)}
          subColor={stockPL >= 0 ? C.green : C.red}
          sub={`${stockPL >= 0 ? "+" : ""}${stockCost ? ((stockPL / stockCost) * 100).toFixed(2) : 0}%`} />
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
        <SectionTitle>Add Stock</SectionTitle>
        <AddRow saving={saving} onAdd={add} fields={[
          { key: "ticker",   placeholder: "TICKER", width: 90 },
          { key: "qty",      placeholder: "Qty",    type: "number", width: 70 },
          { key: "avgPrice", placeholder: "Avg ₹",  type: "number", width: 100 },
          { key: "sector",   placeholder: "Sector", width: 110 },
        ]} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: C.muted }}>
                {["Ticker","Sector","Qty","Avg ₹","CMP ₹","Value","P&L","P&L %",""].map(h => (
                  <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stocks.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>No stocks yet</td></tr>
              ) : stocks.map(st => {
                const cv  = st.qty * (st.cmp || 0);
                const pl  = cv - st.qty * st.avgPrice;
                const plP = st.avgPrice ? ((pl / (st.qty * st.avgPrice)) * 100).toFixed(2) : "0.00";
                return (
                  <tr key={st._id} style={{ borderBottom: `1px solid ${C.border}22` }}>
                    <td style={{ padding: "11px 10px", color: C.gold, fontWeight: 700 }}>{st.ticker}</td>
                    <td style={{ padding: "11px 10px" }}><Pill color={C.blue}>{st.sector}</Pill></td>
                    <td style={{ padding: "11px 10px", color: C.text }}>{st.qty}</td>
                    <td style={{ padding: "11px 10px", fontFamily: "monospace" }}>₹{st.avgPrice?.toLocaleString()}</td>
                    <td style={{ padding: "6px 10px" }}>
                      {cmpEdit[st._id] !== undefined ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <input type="number" value={cmpEdit[st._id]}
                            onChange={e => setCmpEdit(p => ({ ...p, [st._id]: e.target.value }))}
                            min="0.01"
                            step="0.01"
                            style={{ width: 80, padding: "4px 8px", background: C.surface, border: `1px solid ${C.gold}`, borderRadius: 6, color: C.text, fontSize: 12 }} />
                          <button onClick={() => saveCMP(st._id, cmpEdit[st._id])}
                            style={{ background: C.gold, color: "#0D0F14", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>✓</button>
                        </div>
                      ) : (
                        <span style={{ fontFamily: "monospace", cursor: "pointer", color: C.text }}
                          onClick={() => setCmpEdit(p => ({ ...p, [st._id]: st.cmp || "" }))}>
                          ₹{(st.cmp || 0).toLocaleString()} <span style={{ fontSize: 10, color: C.muted }}>✎</span>
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "11px 10px", fontFamily: "monospace", fontWeight: 600 }}>{fmt(cv)}</td>
                    <td style={{ padding: "11px 10px", color: pl >= 0 ? C.green : C.red, fontFamily: "monospace" }}>
                      {pl >= 0 ? "+" : ""}{fmt(pl)}
                    </td>
                    <td style={{ padding: "11px 10px", color: pl >= 0 ? C.green : C.red, fontFamily: "monospace" }}>
                      {pl >= 0 ? "+" : ""}{plP}%
                    </td>
                    <td style={{ padding: "11px 10px" }}>
                      <button onClick={() => del(st._id)}
                        style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14 }}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Mutual Funds Tab ──────────────────────────────────────────────────────────
function MFTab() {
  const [funds,   setFunds]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await getMF(); setFunds(data); }
    catch (e) { setError(e.response?.data?.error || "Failed to load MFs"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const add = async (vals) => {
    if (!vals.name || !vals.invested) return;
    setSaving(true);
    try {
      const invested = Number(vals.invested);
      const units    = Number(vals.units)  || 100;
      const navBuy   = Number(vals.navBuy) || invested / units;
      const { data } = await createMF({
        name: vals.name, type: vals.type, invested,
        units, navAtBuy: navBuy, currentNav: navBuy,
      });
      setFunds(p => [...p, data]);
    } catch (e) { setError(e.response?.data?.error || "Failed to add MF"); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    try { await deleteMF(id); setFunds(p => p.filter(f => f._id !== id)); }
    catch (e) { setError("Delete failed"); }
  };

  const mfVal  = funds.reduce((s, m) => s + (m.units || 0) * (m.currentNav || 0), 0);
  const mfCost = funds.reduce((s, m) => s + m.invested, 0);
  const mfPL   = mfVal - mfCost;

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && <ErrorBox message={error} onRetry={load} />}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <MetricCard icon="🔵" label="MF Value"   value={fmt(mfVal)} />
        <MetricCard icon="💵" label="Invested"    value={fmt(mfCost)} />
        <MetricCard icon="📈" label="Returns"     value={fmt(mfPL)}
          subColor={mfPL >= 0 ? C.green : C.red}
          sub={`${mfPL >= 0 ? "+" : ""}${mfCost ? ((mfPL / mfCost) * 100).toFixed(2) : 0}%`} />
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
        <SectionTitle>Add Mutual Fund</SectionTitle>
        <AddRow saving={saving} onAdd={add} fields={[
          { key: "name",     placeholder: "Fund Name",    width: 180 },
          { key: "type",     options: ["Equity","Debt","Hybrid","Index","ELSS"], default: "Equity" },
          { key: "invested", placeholder: "Invested ₹",  type: "number", width: 110 },
          { key: "units",    placeholder: "Units",        type: "number", width: 80 },
          { key: "navBuy",   placeholder: "NAV at buy",   type: "number", width: 100 },
        ]} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {funds.length === 0 ? (
            <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 24 }}>No mutual funds yet</div>
          ) : funds.map(m => {
            const cv  = (m.units || 0) * (m.currentNav || 0);
            const pl  = cv - m.invested;
            const plP = m.invested ? ((pl / m.invested) * 100).toFixed(2) : "0.00";
            return (
              <div key={m._id} style={{ background: C.accent, borderRadius: 12, padding: 16, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{m.name}</div>
                  <Pill color={m.type === "Equity" ? C.purple : C.blue}>{m.type}</Pill>
                </div>
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                  {[["Invested", fmt(m.invested), C.muted], ["Current", fmt(cv), C.text], ["Return", `${pl >= 0 ? "+" : ""}${plP}%`, pl >= 0 ? C.green : C.red]].map(([l, v, c]) => (
                    <div key={l} style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: C.muted }}>{l}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c, fontFamily: "monospace" }}>{v}</div>
                    </div>
                  ))}
                  <button onClick={() => del(m._id)}
                    style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14 }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── FD Tab ────────────────────────────────────────────────────────────────────
function FDTab() {
  const [fds,     setFDs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await getFDs(); setFDs(data); }
    catch (e) { setError(e.response?.data?.error || "Failed to load FDs"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const add = async (vals) => {
    if (!vals.bank || !vals.principal || !vals.rate || !vals.startDate) return;
    setSaving(true);
    try {
      const { data } = await createFD({
        bank: vals.bank, principal: Number(vals.principal),
        rate: Number(vals.rate), tenure: Number(vals.tenure) || 12,
        startDate: vals.startDate,
      });
      setFDs(p => [...p, data]);
    } catch (e) { setError(e.response?.data?.error || "Failed to add FD"); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    try { await deleteFD(id); setFDs(p => p.filter(f => f._id !== id)); }
    catch (e) { setError("Delete failed"); }
  };

  const fdMV  = fds.reduce((s, f) => s + fdCalc(f).mat, 0);
  const fdInt = fds.reduce((s, f) => s + fdCalc(f).int, 0);

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && <ErrorBox message={error} onRetry={load} />}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <MetricCard icon="🏛️" label="Maturity Value" value={fmt(fdMV)} />
        <MetricCard icon="✨" label="Interest Earned" value={fmt(fdInt)} subColor={C.gold} />
        <MetricCard icon="📄" label="Active FDs"      value={fds.length} />
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
        <SectionTitle>Add Fixed Deposit</SectionTitle>
        <AddRow saving={saving} onAdd={add} fields={[
          { key: "bank",      placeholder: "Bank Name",  width: 120 },
          { key: "principal", placeholder: "Principal ₹", type: "number", width: 120 },
          { key: "rate",      placeholder: "Rate % p.a.", type: "number", width: 100 },
          { key: "tenure",    placeholder: "Months",      type: "number", width: 80 },
          { key: "startDate", placeholder: "Start Date",  type: "date",   width: 145 },
        ]} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {fds.length === 0 ? (
            <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 24 }}>No fixed deposits yet</div>
          ) : fds.map(fd => {
            const { mat, int } = fdCalc(fd);
            const start   = new Date(fd.startDate);
            const end     = new Date(start); end.setMonth(end.getMonth() + fd.tenure);
            const progress = Math.min(((Date.now() - start) / (end - start)) * 100, 100);
            return (
              <div key={fd._id} style={{ background: C.accent, borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{fd.bank} FD</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                      {fd.tenure} months · {fd.rate}% p.a. · Started {new Date(fd.startDate).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    {[["Principal", fmt(fd.principal), C.text], ["Maturity", fmt(mat), C.green], ["Interest", `+${fmt(int)}`, C.gold]].map(([l, v, c]) => (
                      <div key={l} style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: C.muted }}>{l}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: c, fontFamily: "monospace" }}>{v}</div>
                      </div>
                    ))}
                    <button onClick={() => del(fd._id)}
                      style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14 }}>✕</button>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginBottom: 4 }}>
                    <span>{new Date(fd.startDate).toLocaleDateString("en-IN")}</span>
                    <span>{Math.max(0, progress).toFixed(0)}% complete</span>
                    <span>{end.toLocaleDateString("en-IN")}</span>
                  </div>
                  <div style={{ height: 7, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.max(0, progress)}%`, background: C.gold, borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Liquid Tab ────────────────────────────────────────────────────────────────
function LiquidTab() {
  const [balance,  setBalance]  = useState(0);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(false);

  useEffect(() => {
    getLiquid()
      .then(({ data }) => setBalance(data.balance || 0))
      .catch(e => setError(e.response?.data?.error || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    const v = Number(input);
    if (!v || isNaN(v)) return;
    setSaving(true); setError(null);
    try {
      const { data } = await updateLiquid(v);
      setBalance(data.balance); setInput(""); setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) { setError(e.response?.data?.error || "Update failed"); }
    finally { setSaving(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, maxWidth: 480 }}>
      {error && <ErrorBox message={error} />}
      <SectionTitle>Liquid Cash Balance</SectionTitle>
      <div style={{ fontSize: 42, fontWeight: 800, color: C.text, fontFamily: "monospace", letterSpacing: "-1.5px", marginBottom: 6 }}>
        {fmt(balance)}
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 24 }}>Available for immediate use</div>
      <div style={{ display: "flex", gap: 10 }}>
        <input type="number" placeholder="Enter new balance ₹" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && save()}
          style={{ flex: 1, padding: "10px 14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 14, outline: "none" }} />
        <button onClick={save} disabled={saving}
          style={{ padding: "10px 22px", background: saving ? C.goldDim : C.gold, color: "#0D0F14", border: "none", borderRadius: 9, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "…" : success ? "✓ Saved" : "Update"}
        </button>
      </div>
    </div>
  );
}

// ── Portfolio Shell ───────────────────────────────────────────────────────────
const TABS = [["stocks","Stocks"], ["mf","Mutual Funds"], ["fds","Fixed Deposits"], ["liquid","Liquid Cash"]];

export default function Portfolio() {
  const [tab, setTab] = useState("stocks");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 4, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, width: "fit-content" }}>
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding: "8px 16px", borderRadius: 9, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s",
              background: tab === k ? C.gold : "transparent",
              color:      tab === k ? "#0D0F14" : C.muted }}>
            {l}
          </button>
        ))}
      </div>
      {tab === "stocks" && <StocksTab />}
      {tab === "mf"     && <MFTab />}
      {tab === "fds"    && <FDTab />}
      {tab === "liquid" && <LiquidTab />}
    </div>
  );
}
