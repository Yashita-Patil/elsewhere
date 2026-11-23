export default function StatusBadge({ status, className = "" }) {
  const normalized = (status || "").toLowerCase();
  let variant = "upcoming";
  if (normalized === "confirmed") variant = "confirmed";
  else if (normalized === "completed") variant = "completed";
  else if (normalized === "cancelled") variant = "cancelled";

  return (
    <span className={`status-badge is-${variant} ${className}`}>
      <span className="status-badge-dot" aria-hidden="true" />
      {status || "Upcoming"}
    </span>
  );
}
