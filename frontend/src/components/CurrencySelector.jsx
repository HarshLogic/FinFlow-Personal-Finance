import React from "react";
import { useCurrency, SUPPORTED_CURRENCIES } from "../context/CurrencyContext";
import { C } from "../shared";

export const CurrencySelector = () => {
  const { currency, setCurrency, isLiveRatesAvailable, isLoadingRates } =
    useCurrency();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        style={{
          padding: "6px 12px",
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          color: C.text,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          outline: "none",
          minWidth: 100,
        }}
      >
        {Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => (
          <option key={code} value={code}>
            {info.symbol} {code} - {info.label}
          </option>
        ))}
      </select>
      {isLiveRatesAvailable && (
        <span
          style={{
            fontSize: 10,
            color: C.green,
            fontWeight: 600,
          }}
          title="Live exchange rates active"
        >
          🔄
        </span>
      )}
      {isLoadingRates && (
        <span
          style={{
            fontSize: 10,
            color: C.muted,
          }}
          title="Loading rates..."
        >
          ⏳
        </span>
      )}
    </div>
  );
};
