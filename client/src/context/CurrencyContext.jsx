import { createContext, useContext, useEffect, useState } from "react";

export const CURRENCY_STORAGE_KEY = "elsewhere-currency";

export const CURRENCY_CONFIG = {
  USD: {
    code: "USD",
    symbol: "$",
    rate: 1,
    locale: "en-US",
    label: "USD ($)",
  },
  INR: {
    code: "INR",
    symbol: "₹",
    rate: 85,
    locale: "en-IN",
    label: "INR (₹)",
  },
};

export const DEFAULT_CURRENCY = "USD";

export function convertAmount(amountUSD, currencyCode = "USD") {
  if (amountUSD == null || isNaN(Number(amountUSD))) return 0;
  const config = CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG.USD;
  return Number(amountUSD) * config.rate;
}

export function formatCurrency(amountUSD, currencyCode = "USD") {
  if (amountUSD == null || isNaN(Number(amountUSD))) return "";
  const config = CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG.USD;
  const converted = Number(amountUSD) * config.rate;
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
}

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
    return saved && CURRENCY_CONFIG[saved] ? saved : DEFAULT_CURRENCY;
  });

  const setCurrency = (nextCurrency) => {
    if (CURRENCY_CONFIG[nextCurrency]) {
      setCurrencyState(nextCurrency);
      localStorage.setItem(CURRENCY_STORAGE_KEY, nextCurrency);
    }
  };

  const format = (amountUSD) => formatCurrency(amountUSD, currency);
  const convert = (amountUSD) => convertAmount(amountUSD, currency);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatPrice: format,
        convertPrice: convert,
        currencyConfig: CURRENCY_CONFIG[currency],
        currencies: Object.keys(CURRENCY_CONFIG),
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Graceful fallback for non-context callers
    return {
      currency: "USD",
      setCurrency: () => {},
      formatPrice: (amount) => formatCurrency(amount, "USD"),
      convertPrice: (amount) => convertAmount(amount, "USD"),
      currencyConfig: CURRENCY_CONFIG.USD,
      currencies: Object.keys(CURRENCY_CONFIG),
    };
  }
  return context;
}
