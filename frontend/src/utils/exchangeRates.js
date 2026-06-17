import axios from "axios";

// Free API - ExchangeRate-API (no API key required for free tier)
const BASE_URL = "https://api.exchangerate-api.com/v4/latest/INR";

// Backup free API (in case primary fails)
const BACKUP_URL =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/inr.json";

/**
 * Fetch live exchange rates with INR as base
 * Returns: { USD: 83.5, EUR: 90.2, ... }
 */
export const fetchExchangeRates = async () => {
  try {
    // Primary API
    const response = await axios.get(BASE_URL);
    if (response.data && response.data.rates) {
      return response.data.rates;
    }
    throw new Error("No rates in response");
  } catch (error) {
    console.warn("Primary API failed, trying backup...", error.message);

    try {
      // Backup API (returns rates with INR as base)
      const backupResponse = await axios.get(BACKUP_URL);
      if (backupResponse.data && backupResponse.data.inr) {
        // Convert to { USD: 83.5, EUR: 90.2, ... } format
        const rates = backupResponse.data.inr;
        const formattedRates = {};
        for (const [currency, rate] of Object.entries(rates)) {
          // Rate is 1 INR = X currency
          formattedRates[currency.toUpperCase()] = 1 / rate;
        }
        return formattedRates;
      }
      throw new Error("No rates in backup response");
    } catch (backupError) {
      console.error(
        "All APIs failed, using static rates:",
        backupError.message,
      );
      return null; // Fallback to static rates from SUPPORTED_CURRENCIES
    }
  }
};

/**
 * Get rate for specific currency
 */
export const getLiveRate = async (currencyCode) => {
  const rates = await fetchExchangeRates();
  if (rates && rates[currencyCode]) {
    return rates[currencyCode];
  }
  return null; // Use static rate as fallback
};

/**
 * Check if live rates are available
 */
export const isLiveRatesAvailable = async () => {
  try {
    const response = await axios.get(BASE_URL, { timeout: 3000 });
    return response.status === 200;
  } catch {
    return false;
  }
};
