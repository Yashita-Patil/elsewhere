// $2,450
export const formatPrice = (price) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price);

// "Mar 10, 2027"  (dates are stored as UTC midnight, so we read them in UTC)
export const formatDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

// Today as "YYYY-MM-DD" (used as the minimum for date inputs)
export const today = () => new Date().toISOString().slice(0, 10);
