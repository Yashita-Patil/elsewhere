import { Link } from "react-router-dom";
import { ArrowUpRight, Star, Eye } from "lucide-react";
import Button from "./ui/Button";
import { useCurrency } from "../context/CurrencyContext";

export default function PackageCard({ item, onBook }) {
  const { formatPrice } = useCurrency();

  return (
    <article className="package-card">
      <div className="package-photo">
        <Link to={`/packages/${item._id}`} aria-label={`View details of ${item.title}`}>
          <img src={item.image} alt={item.location} loading="lazy" width={1280} height={960} />
        </Link>
        <span className="package-tag">{item.category}</span>
        <span className="package-rating">
          <Star fill="currentColor" aria-hidden="true" /> {Number(item.rating || 5).toFixed(2)}
        </span>
      </div>
      <div className="package-info">
        <p className="package-location">{item.location}</p>
        <h3>
          <Link to={`/packages/${item._id}`} className="package-title-link">
            {item.title}
          </Link>
        </h3>
        <p className="package-description">{item.description}</p>
        <div className="package-meta">
          <span>{item.duration} days</span>
          <span>
            From <strong>{formatPrice(item.price)}</strong> <small>/ person</small>
          </span>
        </div>
        <div className="package-card-actions">
          <Button asChild variant="outline" className="package-details-btn">
            <Link to={`/packages/${item._id}`}>
              View details <Eye className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
          <Button className="package-book" onClick={() => onBook(item)}>
            Enquire <ArrowUpRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </article>
  );
}
