import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  Sparkles,
  Star,
  MapPin,
  Calendar,
  X,
  Compass,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/Dialog";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { api } from "../api";
import { useCurrency } from "../context/CurrencyContext";

const travelStyles = [
  "All travel styles",
  "Adventure",
  "Relaxation",
  "Family",
  "Romantic",
  "Cultural",
  "Wildlife",
  "Luxury",
  "Budget travel",
];

const budgetTiers = [
  { label: "Any budget", value: null },
  { label: "Under $1,500", value: 1500 },
  { label: "Under $2,000", value: 2000 },
  { label: "Under $2,500", value: 2500 },
  { label: "Under $3,000", value: 3000 },
  { label: "Under $4,000", value: 4000 },
  { label: "Under $5,000", value: 5000 },
];

export default function PlannerDialog({
  open,
  onOpenChange,
  destinations = [],
  onSelectPackageForBooking,
}) {
  const navigate = useNavigate();
  const { formatPrice, currency, convertPrice } = useCurrency();

  const [destination, setDestination] = useState("");
  const [style, setStyle] = useState("All travel styles");
  const [budget, setBudget] = useState("Any budget");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  // Find max price limit number in USD
  const maxPriceUSD = useMemo(() => {
    const found = budgetTiers.find((b) => b.label === budget);
    return found ? found.value : null;
  }, [budget]);

  // Execute search with all 3 filters combined
  const fetchMatchingTrips = async () => {
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const params = new URLSearchParams();

      if (destination.trim()) {
        params.set("place", destination.trim());
      }

      if (style && style !== "All travel styles") {
        params.set("category", style);
      }

      if (maxPriceUSD) {
        params.set("maxPrice", maxPriceUSD);
      }

      const data = await api.get(`/packages?${params.toString()}`);
      setResults(data);
    } catch (err) {
      setError(err.message || "Failed to find matching packages");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when open changes or inputs change (with debounce)
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        fetchMatchingTrips();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open, destination, style, budget]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResetFilters = () => {
    setDestination("");
    setStyle("All travel styles");
    setBudget("Any budget");
  };

  const handleViewDetails = (packageId) => {
    onOpenChange(false);
    navigate(`/packages/${packageId}`);
  };

  const handleBookPackage = (pkg) => {
    onOpenChange(false);
    if (onSelectPackageForBooking) {
      onSelectPackageForBooking(pkg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="travel-dialog planner-dialog-full">
        <DialogHeader>
          <p className="eyebrow">
            <span className="eyebrow-line" />
            Curated Trip Finder
          </p>
          <DialogTitle>
            Plan your <em>custom elsewhere.</em>
          </DialogTitle>
          <DialogDescription>
            Filter by destination, travel style, and maximum budget to uncover matching journeys.
          </DialogDescription>
        </DialogHeader>

        {/* 3 Inputs Section */}
        <div className="planner-filter-grid">
          {/* 1. Destination */}
          <div className="planner-field">
            <label htmlFor="planner-dest" className="planner-label">
              <MapPin className="w-3.5 h-3.5" /> Destination
            </label>
            <div className="planner-input-wrap">
              <select
                id="planner-dest"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="planner-select"
              >
                <option value="">All destinations</option>
                {destinations.map((d) => (
                  <option key={d._id || d.slug} value={d.name}>
                    {d.name}, {d.country}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Travel Style */}
          <div className="planner-field">
            <label htmlFor="planner-style" className="planner-label">
              <Compass className="w-3.5 h-3.5" /> Travel Style
            </label>
            <div className="planner-input-wrap">
              <select
                id="planner-style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="planner-select"
              >
                {travelStyles.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Budget */}
          <div className="planner-field">
            <label htmlFor="planner-budget" className="planner-label">
              <Sparkles className="w-3.5 h-3.5" /> Maximum Budget
            </label>
            <div className="planner-input-wrap">
              <select
                id="planner-budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="planner-select"
              >
                {budgetTiers.map((tier) => {
                  let displayLabel = tier.label;
                  if (tier.value && currency !== "USD") {
                    displayLabel = `Under ${formatPrice(tier.value)}`;
                  }
                  return (
                    <option key={tier.label} value={tier.label}>
                      {displayLabel}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Action Button & Active Filter Summary */}
        <div className="planner-action-bar">
          <div className="planner-summary-text">
            <span>
              Showing {results.length} {results.length === 1 ? "journey" : "journeys"}
              {destination ? ` in ${destination}` : ""}
              {style !== "All travel styles" ? ` · ${style}` : ""}
              {maxPriceUSD ? ` · under ${formatPrice(maxPriceUSD)}` : ""}
            </span>
          </div>
          <div className="planner-btn-group">
            {(destination || style !== "All travel styles" || budget !== "Any budget") && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters} className="clear-filter-btn">
                <X className="w-3.5 h-3.5 mr-1" /> Reset filters
              </Button>
            )}
            <Button onClick={fetchMatchingTrips} disabled={loading} className="planner-search-btn">
              <Search className="w-4 h-4 mr-1.5" /> {loading ? "Searching..." : "Find My Trip"}
            </Button>
          </div>
        </div>

        {/* Results Area */}
        <div className="planner-results-area">
          {loading ? (
            <div className="planner-loading">
              <div className="loading-spinner" />
              <p>Finding journeys matching your preferences...</p>
            </div>
          ) : error ? (
            <div className="planner-error">
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={fetchMatchingTrips}>
                Try again
              </Button>
            </div>
          ) : results.length === 0 && searched ? (
            <div className="planner-empty-box">
              <Compass className="w-8 h-8 empty-icon" />
              <h4>No matching journeys found</h4>
              <p>
                We couldn't find any packages matching {destination ? `"${destination}"` : "your criteria"}{" "}
                in the {style !== "All travel styles" ? `"${style}"` : ""} category under{" "}
                {maxPriceUSD ? formatPrice(maxPriceUSD) : "your budget"}.
              </p>
              <div className="empty-suggestions">
                <p>Try:</p>
                <ul>
                  <li>Switching travel style to "All travel styles"</li>
                  <li>Selecting a higher maximum budget tier</li>
                  <li>Searching across all destinations</li>
                </ul>
              </div>
              <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-3">
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="planner-results-grid">
              {results.map((item) => (
                <article key={item._id} className="planner-result-card">
                  <div className="result-thumb-wrap">
                    <img src={item.image} alt={item.title} loading="lazy" />
                    <span className="result-category-pill">{item.category}</span>
                  </div>
                  <div className="result-body">
                    <div className="result-header-line">
                      <p className="result-location">
                        <MapPin className="w-3 h-3 inline-block mr-1 text-rust" />
                        {item.location}
                      </p>
                      <span className="result-rating">
                        <Star className="w-3 h-3 fill-current inline-block mr-0.5 text-rust" />
                        {Number(item.rating || 5).toFixed(1)}
                      </span>
                    </div>

                    <h4 className="result-title">{item.title}</h4>
                    <p className="result-desc">{item.description}</p>

                    <div className="result-footer">
                      <div className="result-price-block">
                        <span className="result-days">{item.duration} days</span>
                        <div className="result-price">
                          From <strong>{formatPrice(item.price)}</strong>
                          <small> / person</small>
                        </div>
                      </div>

                      <div className="result-actions">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(item._id)}
                          className="result-view-btn"
                        >
                          View Details <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleBookPackage(item)}
                          className="result-book-btn"
                        >
                          Book Trip <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
