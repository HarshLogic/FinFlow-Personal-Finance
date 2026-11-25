import React, { useState, useMemo } from 'react';
import { themes } from '../shared';

// --- Static Currency & Asset Data ---
const currencies = {
  "Asia": [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  ],
  "Americas & Others": [
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  ],
};

const allCurrencies = Object.values(currencies).flat();

const investmentTypes = [
  { id: 'stocks', name: 'Direct Equity / Stocks', icon: '📈' },
  { id: 'mutual_funds', name: 'Mutual Funds & ETFs', icon: '📊' },
  { id: 'bonds', name: 'Govt. Bonds / Debt', icon: '🏛️' },
  { id: 'gold', name: 'Digital & Physical Gold', icon: '🥇' },
  { id: 'fixed_deposits', name: 'Fixed Deposits (FD)', icon: '🏦' },
  { id: 'reits', name: 'Real Estate / REITs', icon: '🏢' },
  { id: 'crypto', name: 'Crypto & Digital Assets', icon: '₿' },
  { id: 'emergency_fund', name: 'Liquid Emergency Reserve', icon: '🛡️' },
];

export default function InvestmentPlanner({ C = themes.dark }) {
  const [salary, setSalary] = useState('100000');
  const [currency, setCurrency] = useState('INR');
  const [investmentPercentage, setInvestmentPercentage] = useState(30);
  const [allocations, setAllocations] = useState({
    stocks: '40',
    mutual_funds: '30',
    gold: '10',
    fixed_deposits: '20',
  });

  const selectedCurrency = useMemo(
    () => allCurrencies.find((c) => c.code === currency) || { symbol: '₹', code: 'INR' },
    [currency]
  );

  const salaryAmount = parseFloat(salary) || 0;
  const totalInvestmentFund = (salaryAmount * investmentPercentage) / 100;

  const totalAllocation = useMemo(() => {
    return Object.values(allocations).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }, [allocations]);

  const isValidAllocation = Math.abs(totalAllocation - 100) < 0.01;

  const handleAllocationChange = (investmentId, value) => {
    const numValue = parseFloat(value);
    if (value === '' || (!isNaN(numValue) && numValue >= 0 && numValue <= 100)) {
      setAllocations((prev) => ({
        ...prev,
        [investmentId]: value,
      }));
    }
  };

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${selectedCurrency.symbol}${Math.round(amount).toLocaleString()}`;
    }
  };

  return (
    <div
      style={{
        maxWidth: 1040,
        margin: '0 auto',
        paddingBottom: 48,
        color: C.text,
        fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* Header Banner */}
      <div style={{ textAlign: 'center', paddingTop: 8, paddingBottom: 8 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 54,
            height: 54,
            borderRadius: 16,
            background: `${C.accent}18`,
            border: `1px solid ${C.accent}33`,
            color: C.accent,
            fontSize: 24,
            marginBottom: 14,
            boxShadow: C.shadowSm,
          }}
        >
          📈
        </div>
        <h1
          style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            margin: 0,
            color: C.text,
          }}
        >
          Finance Flow Investment Planner
        </h1>
        <p
          style={{
            color: C.muted,
            maxWidth: 580,
            margin: '8px auto 0 auto',
            fontSize: '0.92rem',
            lineHeight: 1.5,
          }}
        >
          Allocate your monthly income across diverse asset classes and track your financial growth with precision.
        </p>
      </div>

      {/* Step 1: Salary & Savings Rate */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: '24px 28px',
          boxShadow: C.shadowSm,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: `1px solid ${C.border}`,
            paddingBottom: 14,
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: C.accent,
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            1
          </span>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: C.text }}>
            Monthly Income & Target Rate
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 6 }}>
              Net Monthly Salary / Inflow
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 14,
                  color: C.muted,
                  fontWeight: 600,
                  fontSize: 15,
                  pointerEvents: 'none',
                }}
              >
                {selectedCurrency.symbol}
              </span>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. 100000"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: '10px 14px 10px 36px',
                  color: C.text,
                  fontSize: 14,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 6 }}>
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '10px 14px',
                color: C.text,
                fontSize: 14,
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {Object.entries(currencies).map(([region, list]) => (
                <optgroup key={region} label={region} style={{ background: C.card, color: C.accent }}>
                  {list.map((c) => (
                    <option key={c.code} value={c.code} style={{ background: C.surface, color: C.text }}>
                      {c.code} ({c.symbol}) - {c.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div style={{ paddingTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: C.muted, fontWeight: 500 }}>Portion Allocated to Invest:</span>
            <span
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: C.accent,
                background: `${C.accent}18`,
                padding: '2px 10px',
                borderRadius: 6,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {investmentPercentage}%
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={investmentPercentage}
            onChange={(e) => setInvestmentPercentage(Number(e.target.value))}
            style={{
              width: '100%',
              accentColor: C.accent,
              cursor: 'pointer',
              height: 6,
            }}
          />
        </div>

        <div
          style={{
            background: `${C.accent}12`,
            border: `1px solid ${C.accent}33`,
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>Available Monthly Investment Pool:</span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: C.accent,
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatCurrency(totalInvestmentFund)}
          </span>
        </div>
      </div>

      {/* Step 2: Allocation Percentage Matrix */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: '24px 28px',
          boxShadow: C.shadowSm,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: `1px solid ${C.border}`,
            paddingBottom: 14,
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: C.accent,
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            2
          </span>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: C.text }}>
            Asset Class Allocation
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 12,
          }}
        >
          {investmentTypes.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                transition: 'border-color 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{item.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={allocations[item.id] || ''}
                  onChange={(e) => handleAllocationChange(item.id, e.target.value)}
                  style={{
                    width: 54,
                    boxSizing: 'border-box',
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: '6px 8px',
                    textAlign: 'center',
                    color: C.text,
                    fontWeight: 700,
                    fontSize: 13,
                    fontVariantNumeric: 'tabular-nums',
                    outline: 'none',
                  }}
                />
                <span style={{ color: C.muted, fontSize: 13, fontWeight: 600 }}>%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Allocation Counter Bar */}
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 12,
            border: `1px solid ${
              isValidAllocation
                ? `${C.green}44`
                : totalAllocation > 100
                ? `${C.red}44`
                : `${C.warning}44`
            }`,
            background: isValidAllocation
              ? `${C.green}14`
              : totalAllocation > 100
              ? `${C.red}14`
              : `${C.warning}14`,
            color: isValidAllocation
              ? C.green
              : totalAllocation > 100
              ? C.red
              : C.warning,
            transition: 'all 0.25s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, fontWeight: 700 }}>
            <span>Total Allocation:</span>
            <span style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>
              {totalAllocation.toFixed(1)}% / 100%
            </span>
          </div>
          {!isValidAllocation && (
            <p style={{ margin: '6px 0 0 0', fontSize: 12, opacity: 0.9 }}>
              {totalAllocation > 100
                ? `Exceeded by ${(totalAllocation - 100).toFixed(1)}%. Please reduce portfolio weights.`
                : `Add ${(100 - totalAllocation).toFixed(1)}% more to complete your 100% plan.`}
            </p>
          )}
        </div>
      </div>

      {/* Step 3: Breakdown Results */}
      {isValidAllocation && totalInvestmentFund > 0 && (
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: '24px 28px',
            boxShadow: C.shadowSm,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderBottom: `1px solid ${C.border}`,
              paddingBottom: 14,
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: C.accent,
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              3
            </span>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: C.text }}>
              Monthly Investment Portfolio Breakdown
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(allocations)
              .filter(([_, pct]) => parseFloat(pct) > 0)
              .map(([id, pct]) => {
                const item = investmentTypes.find((t) => t.id === id);
                const amount = (totalInvestmentFund * parseFloat(pct)) / 100;
                return (
                  <div
                    key={id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 18px',
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 12,
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 22 }}>{item?.icon || '📁'}</span>
                      <div>
                        <div style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{item?.name || id}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                          {parseFloat(pct).toFixed(1)}% share
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          color: C.accent,
                          fontWeight: 700,
                          fontSize: 16,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatCurrency(amount)}
                      </div>
                      <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>per month</div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
