import { ArrowUpRight, Star } from "lucide-react";
import Button from "./ui/Button";
import { formatPrice } from "../utils/format";

export default function PackageCard({ item, onBook }) {
  return (
    <article className="package-card">
      <div className="package-photo">
        <img src={item.image} alt={item.location} loading="lazy" width={1280} height={960} />
        <span className="package-tag">{item.category}</span>
        <span className="package-rating"><Star fill="currentColor" aria-hidden="true" /> {item.rating.toFixed(2)}</span>
      </div>
      <div className="package-info">
        <p className="package-location">{item.location}</p>
        <h3>{item.title}</h3>
        <p className="package-description">{item.description}</p>
        <div className="package-meta">
          <span>{item.duration} days</span>
          <span>From <strong>{formatPrice(item.price)}</strong> <small>/ person</small></span>
        </div>
        <Button className="package-book" onClick={() => onBook(item)}>
          Enquire about this trip <ArrowUpRight aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}
