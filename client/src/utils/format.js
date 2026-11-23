import { formatCurrency } from "../context/CurrencyContext";

// Format price in USD or specified currency with two decimals (e.g. $1,200.00 or ₹1,02,000.00)
export const formatPrice = (price, currency = "USD") => formatCurrency(price, currency);

// "Mar 10, 2027" (dates are stored as UTC midnight, so we read them in UTC)
export const formatDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

// Today as "YYYY-MM-DD" (used as the minimum for date inputs)
export const today = () => new Date().toISOString().slice(0, 10);
