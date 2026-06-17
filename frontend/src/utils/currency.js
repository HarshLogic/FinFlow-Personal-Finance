import { SUPPORTED_CURRENCIES } from "../context/CurrencyContext";

// Store live rates globally (set by CurrencyContext)
let globalLiveRates = null;

export const setGlobalLiveRates = (rates) => {
  globalLiveRates = rates;
};

export const convertCurrency = (
  amountInINR,
  targetCurrency,
  liveRates = null,
) => {
  if (!amountInINR && amountInINR !== 0) return 0;
  if (targetCurrency === "INR") return amountInINR;

  // Use provided liveRates, then globalLiveRates, then static
  const rates = liveRates || globalLiveRates;
  const rate =
    rates?.[targetCurrency] || SUPPORTED_CURRENCIES[targetCurrency]?.rate || 1;
  return amountInINR / rate;
};

export const convertToINR = (amount, sourceCurrency, liveRates = null) => {
  if (!amount && amount !== 0) return 0;
  if (sourceCurrency === "INR") return amount;

  const rates = liveRates || globalLiveRates;
  const rate =
    rates?.[sourceCurrency] || SUPPORTED_CURRENCIES[sourceCurrency]?.rate || 1;
  return amount * rate;
};

export const formatCurrency = (amountInINR, currencyCode, options = {}) => {
  if (amountInINR === null || amountInINR === undefined || isNaN(amountInINR)) {
    return "₹0";
  }

  const locale = SUPPORTED_CURRENCIES[currencyCode]?.locale || "en-US";
  const convertedAmount = convertCurrency(amountInINR, currencyCode);

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  });

  return formatter.format(convertedAmount);
};

export const formatCurrencyShort = (amountInINR, currencyCode) => {
  if (amountInINR === null || amountInINR === undefined || isNaN(amountInINR)) {
    return "₹0";
  }

  const abs = Math.abs(amountInINR);
  const converted = convertCurrency(amountInINR, currencyCode);
  const symbol = SUPPORTED_CURRENCIES[currencyCode]?.symbol || "₹";

  if (abs >= 10000000) return `${symbol}${(converted / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${symbol}${(converted / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `${symbol}${(converted / 1000).toFixed(1)}k`;

  return formatCurrency(amountInINR, currencyCode);
};

export const getCurrencySymbol = (currencyCode) => {
  return SUPPORTED_CURRENCIES[currencyCode]?.symbol || "₹";
};

export const getCurrencyCode = (currencyCode) => {
  return currencyCode || "INR";
};

export const formatNumber = (number, locale = "en-IN") => {
  if (number === null || number === undefined || isNaN(number)) return "0";
  return new Intl.NumberFormat(locale).format(number);
};
