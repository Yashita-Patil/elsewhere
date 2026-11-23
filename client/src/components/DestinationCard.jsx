import { Link } from "react-router-dom";
import { ArrowUpRight, Heart } from "lucide-react";
import Button from "./ui/Button";
import { useCurrency } from "../context/CurrencyContext";

export default function DestinationCard({ destination, index, total, saved, onToggleSaved }) {
  const { formatPrice } = useCurrency();
  const saveLabel = saved ? `Remove ${destination.name} from saved places` : `Save ${destination.name}`;

  return (
    <article className={`destination-card destination-card-${index + 1}`}>
      <div className="destination-photo">
        <img src={destination.image} alt={`${destination.name}, ${destination.country}`} loading="lazy" width={1280} height={960} />
        <span className="photo-index">0{index + 1} / 0{total}</span>
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
