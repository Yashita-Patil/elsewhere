import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Heart } from "lucide-react";
import Button from "./ui/Button";
import { useCurrency } from "../context/CurrencyContext";

export default function DestinationCard({ destination, index, total, saved, onToggleSaved }) {
  const { formatPrice } = useCurrency();
  const saveLabel = saved ? `Remove ${destination.name} from saved places` : `Save ${destination.name}`;
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.06, rootMargin: "50px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <article
      ref={cardRef}
      style={{ transitionDelay: `${(index % 6) * 65}ms` }}
      className={`destination-card destination-card-${index + 1} ${isVisible ? "is-visible" : ""}`}
    >
      <div className="destination-photo">
        <img src={destination.image} alt={`${destination.name}, ${destination.country}`} loading="lazy" width={1280} height={960} />
        <div className="destination-gradient-overlay" aria-hidden="true" />
        <span className="photo-index">{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
        <Button
          variant="ghost"
          size="icon"
          className={saved ? "save-button is-saved" : "save-button"}
          title={saveLabel}
          aria-label={saveLabel}
          aria-pressed={saved}
          onClick={() => onToggleSaved(destination)}
        >
          <Heart fill={saved ? "currentColor" : "none"} aria-hidden="true" />
        </Button>
      </div>

      <div className="destination-info">
        <div className="destination-title-line">
          <div>
            <p className="destination-country">{destination.country} <span>· {destination.region}</span></p>
            <h3>{destination.name}</h3>
          </div>
          <Button asChild variant="ghost" size="icon" className="card-arrow">
            <Link to={`/destinations/${destination.slug}`} aria-label={`Explore ${destination.name}`}>
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <p className="destination-tagline">{destination.tagline}</p>
        <div className="destination-meta">
          <span>From {formatPrice(destination.from)}</span>
          <span>{destination.days} days</span>
        </div>
      </div>
    </article>
  );
}
