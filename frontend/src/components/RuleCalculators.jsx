import React, { useState } from "react";
import { Calculator, ArrowRight } from "lucide-react";

// Indian currency formatter helper
const formatINR = (val) => {
  const num = Math.round(Number(val) || 0);
  return "₹" + num.toLocaleString("en-IN");
};

// ── 1. EMERGENCY FUND CALCULATOR ──────────────────────────────────────────────
export function EmergencyFundCalculator({ C, onNavigate }) {
  const [expenses, setExpenses] = useState(40000);
  const [months, setMonths] = useState(6);

  const target = Math.max(0, Number(expenses) || 0) * Number(months);

  return (
    <div style={calcContainerStyle(C)}>
      <div style={calcHeaderStyle}>
        <Calculator size={18} color="#10B981" />
        <span style={calcTitleStyle}>Emergency Fund Target Calculator</span>
      </div>
      <div style={calcGridStyle}>
        <div>
          <label style={labelStyle(C)}>Monthly Essential Expenses (₹)</label>
          <input
            type="number"
            min="0"
            value={expenses}
            onChange={(e) => setExpenses(Math.max(0, Number(e.target.value)))}
            style={inputStyle(C)}
          />
        </div>
        <div>
          <label style={labelStyle(C)}>Buffer Duration (Months)</label>
          <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
            {[3, 6, 9, 12].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonths(m)}
                style={chipBtnStyle(months === m, "#10B981", C)}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={resultBoxStyle(C, "#10B981")}>
        <div>
          <span style={{ fontSize: "0.8rem", color: C?.muted || "#9CA3AF" }}>Recommended Cushion ({months} Months)</span>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#10B981" }}>{formatINR(target)}</div>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate("affordability")}
            style={actionBtnStyle("#10B981")}
          >
            Create Goal <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── 2. TERM LIFE INSURANCE CALCULATOR ─────────────────────────────────────────
export function TermLifeCalculator({ C }) {
  const [income, setIncome] = useState(1200000);
  const [debt, setDebt] = useState(2500000);
  const [multiplier, setMultiplier] = useState(12);

  const cleanIncome = Math.max(0, Number(income) || 0);
  const cleanDebt = Math.max(0, Number(debt) || 0);
  const recommendedCover = cleanIncome * multiplier + cleanDebt;

  return (
    <div style={calcContainerStyle(C)}>
      <div style={calcHeaderStyle}>
        <Calculator size={18} color="#3B82F6" />
        <span style={calcTitleStyle}>Term Life Coverage Calculator</span>
      </div>
      <div style={calcGridStyle}>
        <div>
          <label style={labelStyle(C)}>Annual Take-Home Earnings (₹)</label>
          <input
            type="number"
            min="0"
            value={income}
            onChange={(e) => setIncome(Math.max(0, Number(e.target.value)))}
            style={inputStyle(C)}
          />
        </div>
        <div>
          <label style={labelStyle(C)}>Outstanding Debts / Loans (₹)</label>
          <input
            type="number"
            min="0"
            value={debt}
            onChange={(e) => setDebt(Math.max(0, Number(e.target.value)))}
            style={inputStyle(C)}
          />
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <label style={labelStyle(C)}>Income Multiplier ({multiplier}x)</label>
          <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
            {[10, 12, 15, 20].map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => setMultiplier(x)}
                style={chipBtnStyle(multiplier === x, "#3B82F6", C)}
              >
                {x}x
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={resultBoxStyle(C, "#3B82F6")}>
        <div>
          <span style={{ fontSize: "0.8rem", color: C?.muted || "#9CA3AF" }}>Recommended Term Cover</span>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#3B82F6" }}>{formatINR(recommendedCover)}</div>
        </div>
        <span style={{ fontSize: "0.8rem", color: C?.muted || "#9CA3AF" }}>
          {cleanIncome * multiplier > 0 ? `(${multiplier}x Income + Debts cleared)` : ""}
        </span>
      </div>
    </div>
  );
}

// ── 3. 50/30/20 BUDGET CALCULATOR ─────────────────────────────────────────────
export function Budget503020Calculator({ C }) {
  const [income, setIncome] = useState(75000);

  const cleanIncome = Math.max(0, Number(income) || 0);
  const needs = cleanIncome * 0.5;
  const wants = cleanIncome * 0.3;
  const savings = cleanIncome * 0.2;

  return (
    <div style={calcContainerStyle(C)}>
      <div style={calcHeaderStyle}>
        <Calculator size={18} color="#F59E0B" />
        <span style={calcTitleStyle}>50/30/20 Monthly Allocation</span>
      </div>
      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle(C)}>Monthly In-Hand Income (₹)</label>
        <input
          type="number"
          min="0"
          value={income}
          onChange={(e) => setIncome(Math.max(0, Number(e.target.value)))}
          style={inputStyle(C)}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
        <div style={{ ...subCardStyle(C), borderTop: "3px solid #3B82F6" }}>
          <div style={{ fontSize: "0.75rem", color: "#3B82F6", fontWeight: 700 }}>50% NEEDS</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, marginTop: "4px" }}>{formatINR(needs)}</div>
          <div style={{ fontSize: "0.7rem", color: C?.muted || "#9CA3AF" }}>Rent, Groceries, Utilities</div>
        </div>
        <div style={{ ...subCardStyle(C), borderTop: "3px solid #EC4899" }}>
          <div style={{ fontSize: "0.75rem", color: "#EC4899", fontWeight: 700 }}>30% WANTS</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, marginTop: "4px" }}>{formatINR(wants)}</div>
          <div style={{ fontSize: "0.7rem", color: C?.muted || "#9CA3AF" }}>Dining, Travel, Shopping</div>
        </div>
        <div style={{ ...subCardStyle(C), borderTop: "3px solid #10B981" }}>
          <div style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: 700 }}>20% SAVINGS</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, marginTop: "4px" }}>{formatINR(savings)}</div>
          <div style={{ fontSize: "0.7rem", color: C?.muted || "#9CA3AF" }}>SIPs, PPF, Emergency Fund</div>
        </div>
      </div>
    </div>
  );
}

// ── 4. 5% FUN MONEY CALCULATOR ───────────────────────────────────────────────
export function FunMoneyCalculator({ C }) {
  const [income, setIncome] = useState(60000);
  const [percentage, setPercentage] = useState(5);

  const cleanIncome = Math.max(0, Number(income) || 0);
  const monthlyFun = (cleanIncome * percentage) / 100;
  const weeklyFun = monthlyFun / 4.33;

  return (
    <div style={calcContainerStyle(C)}>
      <div style={calcHeaderStyle}>
        <Calculator size={18} color="#8B5CF6" />
        <span style={calcTitleStyle}>Guilt-Free Fun Money Calculator</span>
      </div>
      <div style={calcGridStyle}>
        <div>
          <label style={labelStyle(C)}>Monthly Take-Home Salary (₹)</label>
          <input
            type="number"
            min="0"
            value={income}
            onChange={(e) => setIncome(Math.max(0, Number(e.target.value)))}
            style={inputStyle(C)}
          />
        </div>
        <div>
          <label style={labelStyle(C)}>Fun Allowance % ({percentage}%)</label>
          <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
            {[3, 5, 7, 10].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPercentage(p)}
                style={chipBtnStyle(percentage === p, "#8B5CF6", C)}
              >
                {p}%
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" }}>
        <div style={resultBoxStyle(C, "#8B5CF6")}>
          <div>
            <span style={{ fontSize: "0.75rem", color: C?.muted || "#9CA3AF" }}>Monthly Fun Budget</span>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#8B5CF6" }}>{formatINR(monthlyFun)}</div>
          </div>
        </div>
        <div style={resultBoxStyle(C, "#8B5CF6")}>
          <div>
            <span style={{ fontSize: "0.75rem", color: C?.muted || "#9CA3AF" }}>Weekly Spend Limit</span>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#8B5CF6" }}>{formatINR(weeklyFun)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 5. COMPOUND INTEREST / SIP CALCULATOR ──────────────────────────────────────
export function CompoundInterestCalculator({ C }) {
  const [monthlySIP, setMonthlySIP] = useState(10000);
  const [annualRate, setAnnualRate] = useState(12);
  const [years, setYears] = useState(15);

  const pmt = Math.max(0, Number(monthlySIP) || 0);
  const r = Math.max(0, Number(annualRate) || 0) / 100 / 12;
  const n = Math.max(1, Number(years) || 1) * 12;

  const totalInvested = pmt * n;
  let maturityValue = 0;
  if (r > 0) {
    maturityValue = pmt * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  } else {
    maturityValue = totalInvested;
  }
  const wealthGain = Math.max(0, maturityValue - totalInvested);

  return (
    <div style={calcContainerStyle(C)}>
      <div style={calcHeaderStyle}>
        <Calculator size={18} color="#10B981" />
        <span style={calcTitleStyle}>SIP & Compound Growth Calculator</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        <div>
          <label style={labelStyle(C)}>Monthly Investment (₹)</label>
          <input
            type="number"
            min="0"
            value={monthlySIP}
            onChange={(e) => setMonthlySIP(Math.max(0, Number(e.target.value)))}
            style={inputStyle(C)}
          />
        </div>
        <div>
          <label style={labelStyle(C)}>Expected Return (% p.a.)</label>
          <input
            type="number"
            step="0.5"
            min="1"
            max="35"
            value={annualRate}
            onChange={(e) => setAnnualRate(Math.max(0, Number(e.target.value)))}
            style={inputStyle(C)}
          />
        </div>
        <div>
          <label style={labelStyle(C)}>Tenure (Years: {years})</label>
          <input
            type="range"
            min="1"
            max="35"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            style={{ width: "100%", marginTop: "12px" }}
          />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
        <div style={subCardStyle(C)}>
          <span style={{ fontSize: "0.75rem", color: C?.muted || "#9CA3AF" }}>Total Invested</span>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "2px" }}>{formatINR(totalInvested)}</div>
        </div>
        <div style={subCardStyle(C)}>
          <span style={{ fontSize: "0.75rem", color: "#10B981" }}>Wealth Gained</span>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#10B981", marginTop: "2px" }}>{formatINR(wealthGain)}</div>
        </div>
        <div style={{ ...subCardStyle(C), background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
          <span style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: 700 }}>Maturity Corpus</span>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#10B981", marginTop: "2px" }}>{formatINR(maturityValue)}</div>
        </div>
      </div>
    </div>
  );
}

// ── 6. RULE OF 72 CALCULATOR ──────────────────────────────────────────────────
export function RuleOf72Calculator({ C }) {
  const [interestRate, setInterestRate] = useState(12);

  const rate = Math.max(0.1, Number(interestRate) || 0.1);
  const yearsToDouble = (72 / rate).toFixed(1);

  return (
    <div style={calcContainerStyle(C)}>
      <div style={calcHeaderStyle}>
        <Calculator size={18} color="#F59E0B" />
        <span style={calcTitleStyle}>Rule of 72: Doubling Time</span>
      </div>
      <div style={calcGridStyle}>
        <div>
          <label style={labelStyle(C)}>Expected Annual Return (%)</label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="100"
            value={interestRate}
            onChange={(e) => setInterestRate(Math.max(0.1, Number(e.target.value)))}
            style={inputStyle(C)}
          />
        </div>
        <div>
          <label style={labelStyle(C)}>Popular Benchmarks</label>
          <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
            {[
              { label: "FD (7%)", r: 7 },
              { label: "Nifty 50 (12%)", r: 12 },
              { label: "Midcap (15%)", r: 15 },
            ].map((b) => (
              <button
                key={b.r}
                type="button"
                onClick={() => setInterestRate(b.r)}
                style={chipBtnStyle(interestRate === b.r, "#F59E0B", C)}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={resultBoxStyle(C, "#F59E0B")}>
        <div>
          <span style={{ fontSize: "0.8rem", color: C?.muted || "#9CA3AF" }}>Time to Double Capital</span>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#F59E0B" }}>
            {yearsToDouble} Years
          </div>
        </div>
        <span style={{ fontSize: "0.82rem", color: C?.muted || "#9CA3AF" }}>Formula: 72 ÷ {rate}%</span>
      </div>
    </div>
  );
}

// ── 7. INFLATION & REAL RETURN CALCULATOR ──────────────────────────────────────
export function InflationRealReturnCalculator({ C }) {
  const [nominalReturn, setNominalReturn] = useState(12);
  const [inflationRate, setInflationRate] = useState(6);

  const r = Number(nominalReturn) || 0;
  const i = Number(inflationRate) || 0;
  // Fisher equation for exact real rate: ((1 + r) / (1 + i) - 1) * 100
  const realReturn = (((1 + r / 100) / (1 + i / 100)) - 1) * 100;

  return (
    <div style={calcContainerStyle(C)}>
      <div style={calcHeaderStyle}>
        <Calculator size={18} color="#06B6D4" />
        <span style={calcTitleStyle}>Purchasing Power & Real Return</span>
      </div>
      <div style={calcGridStyle}>
        <div>
          <label style={labelStyle(C)}>Nominal Portfolio Return (% p.a.)</label>
          <input
            type="number"
            step="0.5"
            value={nominalReturn}
            onChange={(e) => setNominalReturn(Number(e.target.value))}
            style={inputStyle(C)}
          />
        </div>
        <div>
          <label style={labelStyle(C)}>Inflation Rate (% p.a.)</label>
          <input
            type="number"
            step="0.5"
            value={inflationRate}
            onChange={(e) => setInflationRate(Number(e.target.value))}
            style={inputStyle(C)}
          />
        </div>
      </div>
      <div style={resultBoxStyle(C, realReturn >= 0 ? "#10B981" : "#EF4444")}>
        <div>
          <span style={{ fontSize: "0.8rem", color: C?.muted || "#9CA3AF" }}>True Real Purchasing Power Growth</span>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: realReturn >= 0 ? "#10B981" : "#EF4444" }}>
            {realReturn.toFixed(2)}% p.a.
          </div>
        </div>
        <span style={{ fontSize: "0.82rem", color: realReturn >= 0 ? "#10B981" : "#EF4444" }}>
          {realReturn >= 0 ? "Beating Inflation ✓" : "Losing Purchasing Power ⚠"}
        </span>
      </div>
    </div>
  );
}

// ── 8. 20/4/10 CAR RULE CALCULATOR ───────────────────────────────────────────
export function Car20410Calculator({ C }) {
  const [carPrice, setCarPrice] = useState(1000000);
  const [monthlyIncome, setMonthlyIncome] = useState(100000);
  const [interestRate, setInterestRate] = useState(9.5);

  const price = Math.max(0, Number(carPrice) || 0);
  const income = Math.max(0, Number(monthlyIncome) || 0);
  const minDownPayment = price * 0.2;
  const loanPrincipal = price - minDownPayment;

  // 4 years = 48 months
  const monthlyRate = (Number(interestRate) || 9.5) / 100 / 12;
  const n = 48;
  const emi = monthlyRate > 0
    ? (loanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
    : loanPrincipal / n;

  const maxAllowedEmi = income * 0.1;
  const isAffordable = emi <= maxAllowedEmi;

  return (
    <div style={calcContainerStyle(C)}>
      <div style={calcHeaderStyle}>
        <Calculator size={18} color="#F97316" />
        <span style={calcTitleStyle}>20/4/10 Car Rule Calculator</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        <div>
          <label style={labelStyle(C)}>On-Road Car Price (₹)</label>
          <input
            type="number"
            min="0"
            value={carPrice}
            onChange={(e) => setCarPrice(Math.max(0, Number(e.target.value)))}
            style={inputStyle(C)}
          />
        </div>
        <div>
          <label style={labelStyle(C)}>Monthly In-Hand Income (₹)</label>
          <input
            type="number"
            min="0"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value)))}
            style={inputStyle(C)}
          />
        </div>
        <div>
          <label style={labelStyle(C)}>Loan Interest (% p.a.)</label>
          <input
            type="number"
            step="0.5"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            style={inputStyle(C)}
          />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <div style={subCardStyle(C)}>
          <span style={{ fontSize: "0.75rem", color: C?.muted || "#9CA3AF" }}>Min 20% Down Payment</span>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "2px" }}>{formatINR(minDownPayment)}</div>
        </div>
        <div style={subCardStyle(C)}>
          <span style={{ fontSize: "0.75rem", color: C?.muted || "#9CA3AF" }}>4-Year Loan EMI</span>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "2px" }}>{formatINR(emi)}/mo</div>
        </div>
        <div style={subCardStyle(C)}>
          <span style={{ fontSize: "0.75rem", color: C?.muted || "#9CA3AF" }}>Max 10% Income Cap</span>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "2px" }}>{formatINR(maxAllowedEmi)}/mo</div>
        </div>
      </div>
      <div style={resultBoxStyle(C, isAffordable ? "#10B981" : "#EF4444")}>
        <div>
          <span style={{ fontSize: "0.8rem", color: C?.muted || "#9CA3AF" }}>20/4/10 Rule Verdict</span>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: isAffordable ? "#10B981" : "#EF4444" }}>
            {isAffordable ? "Within Recommended Budget ✓" : "Exceeds 10% Income Threshold ⚠"}
          </div>
        </div>
        <span style={{ fontSize: "0.8rem", color: C?.muted || "#9CA3AF" }}>
          EMI is {income > 0 ? ((emi / income) * 100).toFixed(1) : 0}% of income
        </span>
      </div>
    </div>
  );
}

// ── 9. EMI RATIO CALCULATOR ───────────────────────────────────────────────────
export function EmiRationCalculator({ C }) {
  const [income, setIncome] = useState(80000);
  const [existingEMI, setExistingEMI] = useState(15000);
  const [newEMI, setNewEMI] = useState(12000);

  const cleanIncome = Math.max(1, Number(income) || 1);
  const totalEMI = Math.max(0, Number(existingEMI) || 0) + Math.max(0, Number(newEMI) || 0);
  const emiRatio = (totalEMI / cleanIncome) * 100;

  const getStatus = (ratio) => {
    if (ratio <= 30) return { label: "Safe Debt Level (<30%)", color: "#10B981" };
    if (ratio <= 40) return { label: "Moderate Caution (30-40%)", color: "#F59E0B" };
    return { label: "High Risk Debt Ratio (>40%)", color: "#EF4444" };
  };

  const status = getStatus(emiRatio);

  return (
    <div style={calcContainerStyle(C)}>
      <div style={calcHeaderStyle}>
        <Calculator size={18} color="#6366F1" />
        <span style={calcTitleStyle}>30-40% EMI Ratio Checker</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        <div>
          <label style={labelStyle(C)}>Monthly Take-Home (₹)</label>
          <input
            type="number"
            min="1"
            value={income}
            onChange={(e) => setIncome(Math.max(1, Number(e.target.value)))}
            style={inputStyle(C)}
          />
        </div>
        <div>
          <label style={labelStyle(C)}>Current Existing EMIs (₹)</label>
          <input
            type="number"
            min="0"
            value={existingEMI}
            onChange={(e) => setExistingEMI(Math.max(0, Number(e.target.value)))}
            style={inputStyle(C)}
          />
        </div>
        <div>
          <label style={labelStyle(C)}>Proposed New EMI (₹)</label>
          <input
            type="number"
            min="0"
            value={newEMI}
            onChange={(e) => setNewEMI(Math.max(0, Number(e.target.value)))}
            style={inputStyle(C)}
          />
        </div>
      </div>
      <div style={resultBoxStyle(C, status.color)}>
        <div>
          <span style={{ fontSize: "0.8rem", color: C?.muted || "#9CA3AF" }}>Combined Debt Ratio: {status.label}</span>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: status.color }}>
            {emiRatio.toFixed(1)}% of Income
          </div>
        </div>
        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: C?.muted || "#9CA3AF" }}>
          Total EMI: {formatINR(totalEMI)}
        </span>
      </div>
    </div>
  );
}

// ── 10. 25X RETIREMENT CORPUS CALCULATOR ──────────────────────────────────────
export function Retirement25xCalculator({ C }) {
  const [monthlyExpenses, setMonthlyExpenses] = useState(50000);
  const [multiplier, setMultiplier] = useState(25);

  const cleanExpenses = Math.max(0, Number(monthlyExpenses) || 0);
  const annualExpenses = cleanExpenses * 12;
  const corpusTarget = annualExpenses * multiplier;

  return (
    <div style={calcContainerStyle(C)}>
      <div style={calcHeaderStyle}>
        <Calculator size={18} color="#10B981" />
        <span style={calcTitleStyle}>FIRE & Rule of 25 Retirement Target</span>
      </div>
      <div style={calcGridStyle}>
        <div>
          <label style={labelStyle(C)}>Expected Monthly Living Cost in Retirement (₹)</label>
          <input
            type="number"
            min="0"
            value={monthlyExpenses}
            onChange={(e) => setMonthlyExpenses(Math.max(0, Number(e.target.value)))}
            style={inputStyle(C)}
          />
        </div>
        <div>
          <label style={labelStyle(C)}>Corpus Multiplier ({multiplier}x)</label>
          <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
            {[25, 30, 33].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMultiplier(m)}
                style={chipBtnStyle(multiplier === m, "#10B981", C)}
              >
                {m}x {m === 25 ? "(4% Rule)" : m === 30 ? "(3.3%)" : "(3.0%)"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={resultBoxStyle(C, "#10B981")}>
        <div>
          <span style={{ fontSize: "0.8rem", color: C?.muted || "#9CA3AF" }}>Target Retirement Corpus ({multiplier}x Annual)</span>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#10B981" }}>{formatINR(corpusTarget)}</div>
        </div>
        <span style={{ fontSize: "0.85rem", color: C?.muted || "#9CA3AF" }}>
          Annual Expenses: {formatINR(annualExpenses)}
        </span>
      </div>
    </div>
  );
}

// ── 11. 4% SAFE WITHDRAWAL RATE CALCULATOR ────────────────────────────────────
export function Withdrawal4PctCalculator({ C }) {
  const [corpus, setCorpus] = useState(20000000); // 2 Crore
  const [withdrawalRate, setWithdrawalRate] = useState(4);

  const cleanCorpus = Math.max(0, Number(corpus) || 0);
  const annualWithdrawal = (cleanCorpus * Number(withdrawalRate)) / 100;
  const monthlyIncome = annualWithdrawal / 12;

  return (
    <div style={calcContainerStyle(C)}>
      <div style={calcHeaderStyle}>
        <Calculator size={18} color="#0EA5E9" />
        <span style={calcTitleStyle}>4% Safe Withdrawal Simulator</span>
      </div>
      <div style={calcGridStyle}>
        <div>
          <label style={labelStyle(C)}>Total Accumulated Portfolio Corpus (₹)</label>
          <input
            type="number"
            min="0"
            value={corpus}
            onChange={(e) => setCorpus(Math.max(0, Number(e.target.value)))}
            style={inputStyle(C)}
          />
        </div>
        <div>
          <label style={labelStyle(C)}>Withdrawal Rate ({withdrawalRate}%)</label>
          <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
            {[3.0, 3.5, 4.0, 4.5].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWithdrawalRate(w)}
                style={chipBtnStyle(withdrawalRate === w, "#0EA5E9", C)}
              >
                {w}%
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" }}>
        <div style={resultBoxStyle(C, "#0EA5E9")}>
          <div>
            <span style={{ fontSize: "0.75rem", color: C?.muted || "#9CA3AF" }}>Safe Annual Withdrawal</span>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0EA5E9" }}>{formatINR(annualWithdrawal)}</div>
          </div>
        </div>
        <div style={resultBoxStyle(C, "#0EA5E9")}>
          <div>
            <span style={{ fontSize: "0.75rem", color: C?.muted || "#9CA3AF" }}>Safe Monthly Cash Flow</span>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0EA5E9" }}>{formatINR(monthlyIncome)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 12. NET WORTH CALCULATOR ──────────────────────────────────────────────────
export function NetWorthCalculator({ C }) {
  const [liquid, setLiquid] = useState(250000);
  const [investments, setInvestments] = useState(1500000);
  const [realEstate, setRealEstate] = useState(4000000);
  const [debts, setDebts] = useState(2800000);

  const totalAssets =
    Math.max(0, Number(liquid) || 0) +
    Math.max(0, Number(investments) || 0) +
    Math.max(0, Number(realEstate) || 0);

  const totalLiabilities = Math.max(0, Number(debts) || 0);
  const netWorth = totalAssets - totalLiabilities;

  return (
    <div style={calcContainerStyle(C)}>
      <div style={calcHeaderStyle}>
        <Calculator size={18} color="#10B981" />
        <span style={calcTitleStyle}>Net Worth Calculator (Assets − Liabilities)</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
        <div>
          <label style={labelStyle(C)}>Liquid Cash & FDs (₹)</label>
          <input
            type="number"
            min="0"
            value={liquid}
            onChange={(e) => setLiquid(Math.max(0, Number(e.target.value)))}
            style={inputStyle(C)}
          />
        </div>
        <div>
          <label style={labelStyle(C)}>Equity & Mutual Funds (₹)</label>
          <input
            type="number"
            min="0"
            value={investments}
            onChange={(e) => setInvestments(Math.max(0, Number(e.target.value)))}
            style={inputStyle(C)}
          />
        </div>
        <div>
          <label style={labelStyle(C)}>Real Estate & Other Assets (₹)</label>
          <input
            type="number"
            min="0"
            value={realEstate}
            onChange={(e) => setRealEstate(Math.max(0, Number(e.target.value)))}
            style={inputStyle(C)}
          />
        </div>
        <div>
          <label style={labelStyle(C)}>Total Loans & Liabilities (₹)</label>
          <input
            type="number"
            min="0"
            value={debts}
            onChange={(e) => setDebts(Math.max(0, Number(e.target.value)))}
            style={inputStyle(C)}
          />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
        <div style={subCardStyle(C)}>
          <span style={{ fontSize: "0.75rem", color: C?.muted || "#9CA3AF" }}>Total Assets</span>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#10B981", marginTop: "2px" }}>
            {formatINR(totalAssets)}
          </div>
        </div>
        <div style={subCardStyle(C)}>
          <span style={{ fontSize: "0.75rem", color: C?.muted || "#9CA3AF" }}>Total Liabilities</span>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#EF4444", marginTop: "2px" }}>
            {formatINR(totalLiabilities)}
          </div>
        </div>
        <div style={resultBoxStyle(C, netWorth >= 0 ? "#10B981" : "#EF4444")}>
          <div>
            <span style={{ fontSize: "0.75rem", color: C?.muted || "#9CA3AF" }}>True Net Worth</span>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: netWorth >= 0 ? "#10B981" : "#EF4444" }}>
              {formatINR(netWorth)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── UNIFIED CALCULATOR DISPATCHER ─────────────────────────────────────────────
export default function RuleCalculator({ type, C, onNavigate }) {
  if (!type) return null;

  switch (type) {
    case "EMERGENCY_FUND":
      return <EmergencyFundCalculator C={C} onNavigate={onNavigate} />;
    case "TERM_LIFE":
      return <TermLifeCalculator C={C} />;
    case "BUDGET_50_30_20":
      return <Budget503020Calculator C={C} />;
    case "FUN_MONEY":
      return <FunMoneyCalculator C={C} />;
    case "COMPOUND_INTEREST":
      return <CompoundInterestCalculator C={C} />;
    case "RULE_OF_72":
      return <RuleOf72Calculator C={C} />;
    case "INFLATION_REAL_RETURN":
      return <InflationRealReturnCalculator C={C} />;
    case "CAR_PURCHASE_20_4_10":
      return <Car20410Calculator C={C} />;
    case "EMI_RATIO":
      return <EmiRationCalculator C={C} />;
    case "RETIREMENT_25X":
      return <Retirement25xCalculator C={C} />;
    case "WITHDRAWAL_4_PCT":
      return <Withdrawal4PctCalculator C={C} />;
    case "NET_WORTH":
      return <NetWorthCalculator C={C} />;
    default:
      return null;
  }
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const calcContainerStyle = (C) => ({
  marginTop: "16px",
  padding: "16px",
  borderRadius: "12px",
  background: C?.cardBg || "rgba(255, 255, 255, 0.02)",
  border: `1px solid ${C?.border || "#374151"}`,
});

const calcHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "14px",
};

const calcTitleStyle = {
  fontSize: "0.9rem",
  fontWeight: 700,
  letterSpacing: "-0.01em",
};

const calcGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  marginBottom: "14px",
};

const labelStyle = (C) => ({
  display: "block",
  fontSize: "0.78rem",
  fontWeight: 600,
  color: C?.muted || "#9CA3AF",
  marginBottom: "4px",
});

const inputStyle = (C) => ({
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 12px",
  borderRadius: "8px",
  background: C?.surface || "#1F2937",
  border: `1px solid ${C?.border || "#4B5563"}`,
  color: C?.text || "#F9FAFB",
  fontSize: "0.88rem",
  outline: "none",
});

const chipBtnStyle = (active, color, C) => ({
  padding: "5px 10px",
  borderRadius: "6px",
  border: `1px solid ${active ? color : (C?.border || "#374151")}`,
  background: active ? `${color}25` : "transparent",
  color: active ? color : (C?.text || "#F9FAFB"),
  fontSize: "0.75rem",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.15s ease",
});

const resultBoxStyle = (C, accentColor) => ({
  padding: "12px 16px",
  borderRadius: "10px",
  background: `${accentColor}10`,
  border: `1px solid ${accentColor}30`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: "8px",
});

const subCardStyle = (C) => ({
  padding: "10px 12px",
  borderRadius: "8px",
  background: C?.surface || "#1F2937",
  border: `1px solid ${C?.border || "#374151"}`,
});

const actionBtnStyle = (color) => ({
  padding: "6px 12px",
  borderRadius: "6px",
  background: color,
  border: "none",
  color: "#FFFFFF",
  fontSize: "0.78rem",
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "4px",
});
