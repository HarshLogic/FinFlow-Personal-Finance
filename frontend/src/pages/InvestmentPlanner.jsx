import React, { useState, useMemo } from 'react';

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

export default function InvestmentPlanner() {
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
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 space-y-8 text-white font-sans">
      {/* Header Banner */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 text-2xl shadow-lg">
          📈
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-teal-200 via-white to-emerald-400 bg-clip-text text-transparent">
          Finance Flow Investment Planner
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto text-sm md:text-base">
          Allocate your monthly income across diverse asset classes and track your financial growth with precision.
        </p>
      </div>

      {/* Step 1: Salary & Savings Rate */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-500 text-black font-bold text-sm">
            1
          </span>
          <h2 className="text-xl font-bold text-zinc-100">Monthly Income & Target Rate</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Net Monthly Salary / Inflow</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">
                {selectedCurrency.symbol}
              </span>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. 100000"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2.5 pl-9 pr-4 text-white focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-teal-500 transition-colors"
            >
              {Object.entries(currencies).map(([region, list]) => (
                <optgroup key={region} label={region} className="bg-zinc-900 text-teal-400">
                  {list.map((c) => (
                    <option key={c.code} value={c.code} className="text-white">
                      {c.code} ({c.symbol}) - {c.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-300">Portion Allocated to Invest:</span>
            <span className="font-semibold text-teal-400 text-base">{investmentPercentage}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={investmentPercentage}
            onChange={(e) => setInvestmentPercentage(Number(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
          />
        </div>

        <div className="bg-teal-950/30 border border-teal-500/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-zinc-400 text-sm">Available Monthly Investment Pool:</span>
          <span className="text-2xl font-bold text-teal-300 tracking-wide">
            {formatCurrency(totalInvestmentFund)}
          </span>
        </div>
      </div>

      {/* Step 2: Allocation Percentage Matrix */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-500 text-black font-bold text-sm">
            2
          </span>
          <h2 className="text-xl font-bold text-zinc-100">Asset Class Allocation</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {investmentTypes.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-zinc-200 text-sm font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={allocations[item.id] || ''}
                  onChange={(e) => handleAllocationChange(item.id, e.target.value)}
                  className="w-16 bg-zinc-900 border border-zinc-700 rounded-lg py-1 px-2 text-center text-white focus:outline-none focus:border-teal-400 text-sm"
                />
                <span className="text-zinc-500 text-sm">%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Allocation Counter Bar */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            isValidAllocation
              ? 'bg-teal-950/30 border-teal-500/40 text-teal-300'
              : totalAllocation > 100
              ? 'bg-red-950/30 border-red-500/40 text-red-300'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
          }`}
        >
          <div className="flex justify-between items-center text-sm font-semibold">
            <span>Total Allocation:</span>
            <span className="text-lg">{totalAllocation.toFixed(1)}% / 100%</span>
          </div>
          {!isValidAllocation && (
            <p className="text-xs mt-1.5 opacity-80">
              {totalAllocation > 100
                ? `Exceeded by ${(totalAllocation - 100).toFixed(1)}%. Please reduce portfolio weights.`
                : `Add ${(100 - totalAllocation).toFixed(1)}% more to complete your 100% plan.`}
            </p>
          )}
        </div>
      </div>

      {/* Step 3: Breakdown Results */}
      {isValidAllocation && totalInvestmentFund > 0 && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-500 text-black font-bold text-sm">
              3
            </span>
            <h2 className="text-xl font-bold text-zinc-100">Monthly Investment Portfolio Breakdown</h2>
          </div>

          <div className="space-y-3">
            {Object.entries(allocations)
              .filter(([_, pct]) => parseFloat(pct) > 0)
              .map(([id, pct]) => {
                const item = investmentTypes.find((t) => t.id === id);
                const amount = (totalInvestmentFund * parseFloat(pct)) / 100;
                return (
                  <div
                    key={id}
                    className="flex justify-between items-center p-3.5 bg-zinc-950/50 border border-zinc-800/80 rounded-xl hover:border-teal-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item?.icon || '📁'}</span>
                      <div>
                        <div className="text-zinc-200 text-sm font-medium">{item?.name || id}</div>
                        <div className="text-xs text-zinc-500">{parseFloat(pct).toFixed(1)}% share</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-teal-400 font-bold text-base">{formatCurrency(amount)}</div>
                      <div className="text-zinc-500 text-xs">per month</div>
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
