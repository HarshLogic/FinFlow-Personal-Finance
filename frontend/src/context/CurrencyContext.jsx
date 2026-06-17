import React, { createContext, useState, useContext, useEffect } from "react";
import { fetchExchangeRates } from "../utils/exchangeRates";

export const SUPPORTED_CURRENCIES = {
  INR: {
    symbol: "₹",
    code: "INR",
    locale: "en-IN",
    rate: 1,
    label: "Indian Rupee",
  },
  USD: {
    symbol: "$",
    code: "USD",
    locale: "en-US",
    rate: 83.5,
    label: "US Dollar",
  },
  EUR: { symbol: "€", code: "EUR", locale: "de-DE", rate: 90.2, label: "Euro" },
  GBP: {
    symbol: "£",
    code: "GBP",
    locale: "en-GB",
    rate: 105.8,
    label: "British Pound",
  },
  JPY: {
    symbol: "¥",
    code: "JPY",
    locale: "ja-JP",
    rate: 0.56,
    label: "Japanese Yen",
  },
  AUD: {
    symbol: "A$",
    code: "AUD",
    locale: "en-AU",
    rate: 55.2,
    label: "Australian Dollar",
  },
  CAD: {
    symbol: "C$",
    code: "CAD",
    locale: "en-CA",
    rate: 61.1,
    label: "Canadian Dollar",
  },
  CHF: {
    symbol: "Fr",
    code: "CHF",
    locale: "de-CH",
    rate: 93.8,
    label: "Swiss Franc",
  },
  CNY: {
    symbol: "¥",
    code: "CNY",
    locale: "zh-CN",
    rate: 11.5,
    label: "Chinese Yuan",
  },
  SGD: {
    symbol: "S$",
    code: "SGD",
    locale: "en-SG",
    rate: 62.0,
    label: "Singapore Dollar",
  },
  AED: {
    symbol: "د.إ",
    code: "AED",
    locale: "ar-AE",
    rate: 22.7,
    label: "UAE Dirham",
  },
  SAR: {
    symbol: "ر.س",
    code: "SAR",
    locale: "ar-SA",
    rate: 22.3,
    label: "Saudi Riyal",
  },
  MYR: {
    symbol: "RM",
    code: "MYR",
    locale: "ms-MY",
    rate: 17.8,
    label: "Malaysian Ringgit",
  },
  THB: {
    symbol: "฿",
    code: "THB",
    locale: "th-TH",
    rate: 2.3,
    label: "Thai Baht",
  },
  KRW: {
    symbol: "₩",
    code: "KRW",
    locale: "ko-KR",
    rate: 0.061,
    label: "South Korean Won",
  },
  RUB: {
    symbol: "₽",
    code: "RUB",
    locale: "ru-RU",
    rate: 0.95,
    label: "Russian Ruble",
  },
  BRL: {
    symbol: "R$",
    code: "BRL",
    locale: "pt-BR",
    rate: 15.8,
    label: "Brazilian Real",
  },
  ZAR: {
    symbol: "R",
    code: "ZAR",
    locale: "en-ZA",
    rate: 4.5,
    label: "South African Rand",
  },
  NZD: {
    symbol: "NZ$",
    code: "NZD",
    locale: "en-NZ",
    rate: 51.0,
    label: "New Zealand Dollar",
  },
  SEK: {
    symbol: "kr",
    code: "SEK",
    locale: "sv-SE",
    rate: 7.9,
    label: "Swedish Krona",
  },
  NOK: {
    symbol: "kr",
    code: "NOK",
    locale: "nb-NO",
    rate: 7.8,
    label: "Norwegian Krone",
  },
  DKK: {
    symbol: "kr",
    code: "DKK",
    locale: "da-DK",
    rate: 12.1,
    label: "Danish Krone",
  },
  PLN: {
    symbol: "zł",
    code: "PLN",
    locale: "pl-PL",
    rate: 20.8,
    label: "Polish Zloty",
  },
  HKD: {
    symbol: "HK$",
    code: "HKD",
    locale: "zh-HK",
    rate: 10.7,
    label: "Hong Kong Dollar",
  },
  TRY: {
    symbol: "₺",
    code: "TRY",
    locale: "tr-TR",
    rate: 2.6,
    label: "Turkish Lira",
  },
};

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem("preferredCurrency") || "INR";
  });
  const [liveRates, setLiveRates] = useState(null);
  const [isLoadingRates, setIsLoadingRates] = useState(true);

  // Fetch live exchange rates on mount
  useEffect(() => {
    const getLiveRates = async () => {
      setIsLoadingRates(true);
      try {
        const rates = await fetchExchangeRates();
        if (rates) {
          setLiveRates(rates);
          console.log("✅ Live exchange rates loaded");
        } else {
          console.log("⚠️ Using static exchange rates");
        }
      } catch (error) {
        console.warn("⚠️ Failed to fetch live rates, using static rates");
      } finally {
        setIsLoadingRates(false);
      }
    };
    getLiveRates();
  }, []);

  // Refresh rates every 5 minutes (optional)
  useEffect(() => {
    const interval = setInterval(
      async () => {
        try {
          const rates = await fetchExchangeRates();
          if (rates) {
            setLiveRates(rates);
            console.log("🔄 Exchange rates refreshed");
          }
        } catch (error) {
          // Silent fail - keep existing rates
        }
      },
      5 * 60 * 1000,
    ); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem("preferredCurrency", currency);
  }, [currency]);

  const getRate = (targetCurrency) => {
    // Use live rate if available, fallback to static
    if (liveRates && liveRates[targetCurrency]) {
      return liveRates[targetCurrency];
    }
    return SUPPORTED_CURRENCIES[targetCurrency]?.rate || 1;
  };

  const getSymbol = (targetCurrency) => {
    return SUPPORTED_CURRENCIES[targetCurrency]?.symbol || "₹";
  };

  const getLocale = (targetCurrency) => {
    return SUPPORTED_CURRENCIES[targetCurrency]?.locale || "en-IN";
  };

  const getCurrencyLabel = (targetCurrency) => {
    return SUPPORTED_CURRENCIES[targetCurrency]?.label || targetCurrency;
  };

  const value = {
    currency,
    setCurrency,
    getRate,
    getSymbol,
    getLocale,
    getCurrencyLabel,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    liveRates,
    isLoadingRates,
    isLiveRatesAvailable: !!liveRates,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
};
