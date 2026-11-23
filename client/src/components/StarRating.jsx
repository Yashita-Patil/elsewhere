import { useState } from "react";
import { Star } from "lucide-react";

export default function StarRating({
  value = 5,
  onChange,
  interactive = false,
  size = "md",
  showLabel = false,
}) {
  const [hoverValue, setHoverValue] = useState(0);

  const starSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
    xl: "w-6 h-6",
  };

  const currentVal = interactive ? (hoverValue || value) : value;

  return (
    <div className="star-rating-wrap" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <div
        className="star-rating-icons"
        style={{ display: "inline-flex", alignItems: "center", gap: 2 }}
        onMouseLeave={() => interactive && setHoverValue(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= currentVal;
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(star)}
              onMouseEnter={() => interactive && setHoverValue(star)}
              style={{
                background: "none",
                border: "none",
                padding: interactive ? 2 : 0,
                cursor: interactive ? "pointer" : "default",
                color: filled ? "var(--rust, #b6522c)" : "var(--border, #d1cdc7)",
                display: "inline-flex",
                alignItems: "center",
                transition: "transform 120ms ease, color 120ms ease",
                transform: interactive && hoverValue === star ? "scale(1.15)" : "none",
              }}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={starSizes[size] || starSizes.md}
                fill={filled ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={1.75}
              />
            </button>
          );
        })}
      </div>
      {showLabel && (
        <span style={{ fontSize: "0.85em", fontWeight: 600, color: "var(--foreground)" }}>
          {Number(value).toFixed(1)}
        </span>
      )}
    </div>
  );
}
