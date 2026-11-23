import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Compass,
  Heart,
  Hotel,
  Info,
  Layers,
  MapPin,
  Plane,
  Shield,
  Sparkles,
  Star,
  Users,
  Utensils,
  XCircle,
} from "lucide-react";
import Button from "../components/ui/Button";
import BookingDialog from "../components/BookingDialog";
import CurrencySelector from "../components/CurrencySelector";
import ReviewsSection from "../components/ReviewsSection";
import StarRating from "../components/StarRating";
import EmptyState from "../components/EmptyState";
import NotFound from "./NotFound";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useModals } from "../context/ModalContext";
import { useCurrency } from "../context/CurrencyContext";
import { travelerOptions } from "../utils/constants";
import { today } from "../utils/format";
import usePageTitle from "../utils/usePageTitle";

export default function PackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openLogin, openDashboard } = useModals();
  const { formatPrice, currency } = useCurrency();

  const [pkg, setPkg] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | notfound | error
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState("");

  // Booking state
  const [bookingOpen, setBookingOpen] = useState(false);
  const [travelers, setTravelers] = useState(2);
  const [travelDate, setTravelDate] = useState("");
  const [bookingNotice, setBookingNotice] = useState("");

  usePageTitle(pkg ? `${pkg.title} — Elsewhere Journeys` : "Journey Details — Elsewhere");

  useEffect(() => {
    setStatus("loading");
    api
      .get(`/packages/${id}`)
      .then((data) => {
        setPkg(data);
        setSelectedImage(data.image);
        setStatus("ready");
      })
      .catch((err) => {
        setErrorMessage(err.message);
        setStatus(err.status === 404 ? "notfound" : "error");
      });
  }, [id]);

  if (status === "notfound") return <NotFound />;
  if (status === "loading") {
    return (
      <main className="package-page">
        <div className="package-loading-screen">
          <div className="loading-spinner" />
          <p>Preparing journey itinerary...</p>
        </div>
      </main>
    );
  }
  if (status === "error") {
    return (
      <main className="package-page">
        <div className="page-wrap" style={{ paddingTop: 100 }}>
          <EmptyState
            title="We couldn't load this package."
            copy={errorMessage}
            buttonLabel="Back to all journeys"
            onClear={() => navigate("/#packages")}
          />
        </div>
      </main>
    );
  }

  const destinationObj = pkg.destination || {};
  const destinationName = destinationObj.name || pkg.location.split(",")[0];
  const destinationSlug = destinationObj.slug || "";

  const galleryImages = [
    pkg.image,
    ...(pkg.gallery || []),
    ...(pkg.accommodation?.image && pkg.accommodation.image !== pkg.image
      ? [pkg.accommodation.image]
      : []),
  ].filter((img, idx, arr) => img && arr.indexOf(img) === idx);

  const nightsCount = pkg.nights || Math.max(1, pkg.duration - 1);
  const totalPrice = pkg.price * travelers;

  const handleStartBooking = () => {
    if (!user) {
      openLogin();
      return;
    }
    setBookingOpen(true);
  };

  const handleBooked = (booking) => {
    setBookingOpen(false);
    setBookingNotice(`Your enquiry for ${booking.title} has been received! Booking ref: ${booking.bookingCode}`);
    setTimeout(() => {
      openDashboard();
    }, 1200);
  };

  return (
    <main className="package-detail-page">
      {/* Top Navigation Bar */}
      <header className="package-topbar">
        <div className="topbar-left">
          <Link to="/" className="wordmark" aria-label="Elsewhere home">
            elsewhere<span>.</span>
          </Link>
          <nav className="breadcrumb-nav" aria-label="Breadcrumb">
            <Link to="/" className="breadcrumb-link">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 breadcrumb-sep" />
            {destinationSlug ? (
              <Link to={`/destinations/${destinationSlug}`} className="breadcrumb-link">
                {destinationName}
              </Link>
            ) : (
              <span className="breadcrumb-link">{destinationName}</span>
            )}
            <ChevronRight className="w-3.5 h-3.5 breadcrumb-sep" />
            <span className="breadcrumb-current">{pkg.title}</span>
          </nav>
        </div>

        <div className="topbar-right">
          <CurrencySelector />
          <Button asChild variant="ghost" size="sm" className="topbar-back-btn">
            <Link to={destinationSlug ? `/destinations/${destinationSlug}` : "/#packages"}>
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
            </Link>
          </Button>
          {user ? (
            <Button variant="ghost" size="sm" onClick={openDashboard} className="header-login">
              <span className="user-initial">{user.name.charAt(0).toUpperCase()}</span> My trips
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={openLogin} className="header-login">
              Log in
            </Button>
          )}
        </div>
      </header>

      {/* Global Booking Notice */}
      {bookingNotice && (
        <div className="booking-notice-banner page-wrap" role="status">
          <Check className="w-4 h-4 mr-2" />
          <span>{bookingNotice}</span>
          <button onClick={() => setBookingNotice("")} className="notice-close">
            ×
          </button>
        </div>
      )}

      {/* Hero / Cover Section */}
      <section className="package-hero-section page-wrap">
        <div className="package-hero-grid">
          {/* Main Visual Image & Gallery Picker */}
          <div className="package-gallery-block">
            <div className="main-image-viewport">
              <img
                src={selectedImage || pkg.image}
                alt={pkg.title}
                className="main-preview-img"
                loading="eager"
              />
              <div className="image-overlay-badges">
                <span className="badge category-badge">{pkg.category}</span>
                <span className="badge duration-badge">
                  <Clock className="w-3 h-3 mr-1 inline-block" /> {pkg.duration} Days / {nightsCount} Nights
                </span>
              </div>
            </div>

            {/* Thumbnail switcher if multiple images */}
            {galleryImages.length > 1 && (
              <div className="gallery-thumbnails-row">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`thumb-btn ${selectedImage === img ? "active" : ""}`}
                    onClick={() => setSelectedImage(img)}
                    aria-label={`View photo ${i + 1}`}
                  >
                    <img src={img} alt={`${pkg.title} thumbnail ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Header Summary */}
          <div className="package-quick-summary">
            <p className="eyebrow">
              <MapPin className="w-3.5 h-3.5" /> {pkg.location}
            </p>
            <h1 className="package-hero-title">{pkg.title}</h1>

            <div className="package-hero-meta">
              <a href="#reviews" className="rating-pill-link">
                <StarRating value={pkg.rating || 5} size="sm" />
                <span className="rating-number">{Number(pkg.rating || 5).toFixed(2)}</span>
                <span className="reviews-count-text">
                  ({pkg.numReviews || 0} {pkg.numReviews === 1 ? "review" : "reviews"})
                </span>
              </a>
              <span className="meta-sep">·</span>
              <span className="style-pill">{pkg.category} Style</span>
            </div>

            <p className="package-short-desc">{pkg.description}</p>

            <div className="hero-price-highlight">
              <div className="price-label">Starting from</div>
              <div className="price-val">
                {formatPrice(pkg.price)} <small>/ person</small>
              </div>
            </div>

            <div className="hero-cta-row">
              <Button onClick={handleStartBooking} className="hero-book-btn">
                Book This Package <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <a href="#overview" className="hero-itinerary-link">
                View Full Itinerary ↓
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout with Sticky Booking Sidebar */}
      <div className="package-body-wrap page-wrap" id="overview">
        {/* Left Column: Detailed Sections A through F */}
        <div className="package-main-column">
          {/* A. Package Overview */}
          <section className="detail-card overview-card">
            <h2 className="section-card-title">Package Overview</h2>
            <div className="overview-stats-grid">
              <div className="stat-box">
                <Clock className="w-5 h-5 stat-icon" />
                <div>
                  <span className="stat-label">Duration</span>
                  <span className="stat-value">{pkg.duration} Days / {nightsCount} Nights</span>
                </div>
              </div>
              <div className="stat-box">
                <Compass className="w-5 h-5 stat-icon" />
                <div>
                  <span className="stat-label">Travel Style</span>
                  <span className="stat-value">{pkg.category}</span>
                </div>
              </div>
              <div className="stat-box">
                <MapPin className="w-5 h-5 stat-icon" />
                <div>
                  <span className="stat-label">Destination</span>
                  <span className="stat-value">{destinationName}</span>
                </div>
              </div>
              <div className="stat-box">
                <Star className="w-5 h-5 stat-icon" />
                <div>
                  <span className="stat-label">Guest Rating</span>
                  <span className="stat-value">{Number(pkg.rating || 5).toFixed(2)} / 5.0</span>
                </div>
              </div>
            </div>

            <div className="detailed-story-block">
              <h3>The Journey Story</h3>
              <p>
                {pkg.detailedDescription ||
                  `${pkg.description} Immerse yourself in an intimate route curated by local specialists, blending handpicked boutique accommodations, private transfers, and unique cultural encounters designed around the unhurried spirit of travel.`}
              </p>
            </div>
          </section>

          {/* B. Accommodation Details */}
          <section className="detail-card accommodation-card" id="accommodation">
            <h2 className="section-card-title">
              <Hotel className="w-5 h-5 section-title-icon" /> Accommodation Details
            </h2>

            {pkg.accommodation ? (
              <div className="accommodation-content">
                <div className="hotel-primary-row">
                  {pkg.accommodation.image && (
                    <div className="hotel-photo-wrap">
                      <img
                        src={pkg.accommodation.image}
                        alt={pkg.accommodation.name || "Accommodation"}
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="hotel-primary-info">
                    <span className="hotel-nights-badge">
                      {pkg.accommodation.nights || nightsCount} Nights Stay
                    </span>
                    <h3 className="hotel-name">{pkg.accommodation.name || "Handpicked Boutique Retreat"}</h3>
                    <p className="hotel-location">
                      <MapPin className="w-3.5 h-3.5 mr-1 inline-block text-rust" />
                      {pkg.accommodation.location || pkg.location}
                    </p>
                    <div className="room-type-tag">
                      <strong>Room Type:</strong> {pkg.accommodation.roomType || "Deluxe Suite"}
                    </div>
                    {pkg.accommodation.mealPlan && (
                      <div className="hotel-meal-plan">
                        <Utensils className="w-3.5 h-3.5 mr-1.5 inline-block text-rust" />
                        <strong>Meal Plan:</strong> {pkg.accommodation.mealPlan}
                      </div>
                    )}
                  </div>
                </div>

                {pkg.accommodation.amenities?.length > 0 && (
                  <div className="hotel-amenities-block">
                    <h4>Included Amenities & Facilities</h4>
                    <div className="amenities-chips-wrap">
                      {pkg.accommodation.amenities.map((item, idx) => (
                        <span key={idx} className="amenity-chip">
                          <Check className="w-3.5 h-3.5 mr-1 text-rust" /> {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="details-not-provided">
                Accommodation details for this itinerary are custom arranged based on selected dates and guest preferences.
              </p>
            )}
          </section>

          {/* C. Transportation Details */}
          <section className="detail-card transportation-card" id="transportation">
            <h2 className="section-card-title">
              <Plane className="w-5 h-5 section-title-icon" /> Transportation Details
            </h2>

            <div className="transport-items-list">
              <div className="transport-item-row">
                <div className="transport-icon-box">
                  <Plane className="w-4 h-4" />
                </div>
                <div className="transport-item-text">
                  <h4>Flights Information</h4>
                  <p>
                    {pkg.transportation?.flightInfo ||
                      "International flights not included (available upon request through our concierge)"}
                  </p>
                </div>
              </div>

              <div className="transport-item-row">
                <div className="transport-icon-box">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="transport-item-text">
                  <h4>Arrival & Departure Handling</h4>
                  <p>
                    {pkg.transportation?.departureArrival ||
                      `Meet & greet services provided at the nearest international gateway for ${pkg.location}`}
                  </p>
                </div>
              </div>

              <div className="transport-item-row">
                <div className="transport-icon-box">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="transport-item-text">
                  <h4>Airport Pickup & Drop-off</h4>
                  <p>
                    {pkg.transportation?.airportTransfer ? (
                      <span className="text-emerald-700 font-medium">
                        ✓ Included: Roundtrip private airport transfers
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Details provided upon booking confirmation</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="transport-item-row">
                <div className="transport-icon-box">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="transport-item-text">
                  <h4>Private / Shared Transfers & Local Transit</h4>
                  <p>
                    {pkg.transportation?.transferType ||
                      "Private air-conditioned transfers for all scheduled itinerary excursions"}
                    {pkg.transportation?.localTransport && ` · ${pkg.transportation.localTransport}`}
                  </p>
                </div>
              </div>

              {pkg.transportation?.otherServices?.length > 0 && (
                <div className="transport-item-row">
                  <div className="transport-icon-box">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="transport-item-text">
                    <h4>Other Included Transport Services</h4>
                    <ul className="sub-services-list">
                      {pkg.transportation.otherServices.map((svc, idx) => (
                        <li key={idx}>✓ {svc}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* D. Meals and Activities */}
          <section className="detail-card meals-activities-card" id="activities">
            <h2 className="section-card-title">
              <Utensils className="w-5 h-5 section-title-icon" /> Meals & Activities
            </h2>

            <div className="activities-grid">
              {/* Meals */}
              <div className="activity-group">
                <h3>
                  <Utensils className="w-4 h-4 mr-1.5 inline-block text-rust" /> Meals & Culinary Inclusions
                </h3>
                {pkg.inclusions?.meals?.length > 0 ? (
                  <ul>
                    {pkg.inclusions.meals.map((item, idx) => (
                      <li key={idx}>
                        <Check className="w-3.5 h-3.5 check-icon" /> {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-detail-note">Daily breakfast included at accommodation</p>
                )}
              </div>

              {/* Sightseeing & Guided Tours */}
              <div className="activity-group">
                <h3>
                  <Compass className="w-4 h-4 mr-1.5 inline-block text-rust" /> Sightseeing & Guided Tours
                </h3>
                {pkg.inclusions?.sightseeing?.length > 0 || pkg.inclusions?.guidedTours?.length > 0 ? (
                  <ul>
                    {[...(pkg.inclusions?.sightseeing || []), ...(pkg.inclusions?.guidedTours || [])].map(
                      (item, idx) => (
                        <li key={idx}>
                          <Check className="w-3.5 h-3.5 check-icon" /> {item}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="no-detail-note">Curated self-guided recommendations & scenic excursions</p>
                )}
              </div>

              {/* Entry Tickets & Cultural Experiences */}
              <div className="activity-group">
                <h3>
                  <Sparkles className="w-4 h-4 mr-1.5 inline-block text-rust" /> Tickets & Cultural Experiences
                </h3>
                {pkg.inclusions?.entryTickets?.length > 0 || pkg.inclusions?.culturalExperiences?.length > 0 ? (
                  <ul>
                    {[
                      ...(pkg.inclusions?.entryTickets || []),
                      ...(pkg.inclusions?.culturalExperiences || []),
                    ].map((item, idx) => (
                      <li key={idx}>
                        <Check className="w-3.5 h-3.5 check-icon" /> {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-detail-note">Monument and heritage tickets included as specified</p>
                )}
              </div>

              {/* Adventure & Other Activities */}
              <div className="activity-group">
                <h3>
                  <Layers className="w-4 h-4 mr-1.5 inline-block text-rust" /> Adventure & Experiences
                </h3>
                {pkg.inclusions?.adventureActivities?.length > 0 || pkg.inclusions?.otherExperiences?.length > 0 ? (
                  <ul>
                    {[
                      ...(pkg.inclusions?.adventureActivities || []),
                      ...(pkg.inclusions?.otherExperiences || []),
                    ].map((item, idx) => (
                      <li key={idx}>
                        <Check className="w-3.5 h-3.5 check-icon" /> {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-detail-note">Specialized outdoor adventures aligned with travel style</p>
                )}
              </div>
            </div>
          </section>

          {/* E. Additional Benefits */}
          <section className="detail-card benefits-card">
            <h2 className="section-card-title">
              <Sparkles className="w-5 h-5 section-title-icon" /> Additional Benefits & Concierge
            </h2>
            <div className="benefits-grid">
              {(pkg.additionalBenefits?.length > 0
                ? pkg.additionalBenefits
                : [
                    "24/7 Dedicated English-speaking travel concierge",
                    "English-speaking licensed professional guide",
                    "Complimentary luggage handling at key checkpoints",
                    "Welcome amenity kit & customized digital itinerary",
                  ]
              ).map((benefit, idx) => (
                <div key={idx} className="benefit-item">
                  <div className="benefit-bullet">✓</div>
                  <span className="benefit-text">{benefit}</span>
                </div>
              ))}
            </div>
          </section>

          {/* F. Package Exclusions */}
          <section className="detail-card exclusions-card">
            <h2 className="section-card-title">
              <XCircle className="w-5 h-5 section-title-icon text-muted-foreground" /> Package Exclusions
            </h2>
            <p className="exclusions-subtitle">
              For complete transparency, the following items are not included in this package price:
            </p>
            <div className="exclusions-grid">
              {(pkg.exclusions?.length > 0
                ? pkg.exclusions
                : [
                    "International airfare and related taxes",
                    "Personal shopping, discretionary tips & gratuities",
                    "Optional excursions and activities not listed in inclusions",
                    "Travel and medical cancellation insurance (strongly recommended)",
                    "Entry visa processing fees",
                  ]
              ).map((exclusion, idx) => (
                <div key={idx} className="exclusion-item">
                  <span className="exclusion-x">✕</span>
                  <span className="exclusion-text">{exclusion}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Reviews & Ratings Component */}
          <ReviewsSection
            packageId={pkg._id}
            itemTitle={pkg.title}
            onRatingUpdate={(newAvg, newCount) => {
              setPkg((prev) => (prev ? { ...prev, rating: newAvg, numReviews: newCount } : prev));
            }}
          />
        </div>

        {/* Right Column: Sticky Booking / Price Calculator Sidebar */}
        <aside className="package-sidebar-column">
          <div className="sticky-booking-card">
            <div className="sidebar-card-header">
              <span className="price-kicker">Package Investment</span>
              <div className="sidebar-price-row">
                <span className="sidebar-price-val">{formatPrice(pkg.price)}</span>
                <span className="sidebar-price-unit">/ person</span>
              </div>
              <p className="sidebar-duration-note">
                {pkg.duration} days · {nightsCount} nights in {pkg.location}
              </p>
            </div>

            <div className="sidebar-calc-form">
              <div className="sidebar-field">
                <label htmlFor="sidebar-date" className="sidebar-field-label">
                  <Calendar className="w-3.5 h-3.5 mr-1 inline-block" /> Preferred Departure Date
                </label>
                <input
                  id="sidebar-date"
                  type="date"
                  min={today()}
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="sidebar-date-input"
                  required
                />
              </div>

              <div className="sidebar-field">
                <label htmlFor="sidebar-travelers" className="sidebar-field-label">
                  <Users className="w-3.5 h-3.5 mr-1 inline-block" /> Number of Travelers
                </label>
                <select
                  id="sidebar-travelers"
                  value={travelers}
                  onChange={(e) => setTravelers(Number(e.target.value))}
                  className="sidebar-select"
                >
                  {travelerOptions.map((cnt) => (
                    <option key={cnt} value={cnt}>
                      {cnt} {cnt === 1 ? "Traveler" : "Travelers"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="sidebar-breakdown">
                <div className="breakdown-line">
                  <span>
                    {formatPrice(pkg.price)} × {travelers} {travelers === 1 ? "traveler" : "travelers"}
                  </span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="breakdown-line">
                  <span>Taxes & Service Fees</span>
                  <span className="included-text">Included</span>
                </div>
                <div className="breakdown-line total-line">
                  <strong>Total Package Price</strong>
                  <strong className="total-amount">{formatPrice(totalPrice)}</strong>
                </div>
              </div>

              <Button onClick={handleStartBooking} className="sidebar-book-btn">
                Book This Package <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="sidebar-guarantees">
                <div className="guarantee-line">
                  <Shield className="w-3.5 h-3.5 mr-1.5 text-rust shrink-0" />
                  <span>Secure server calculation · No hidden booking charges</span>
                </div>
                <div className="guarantee-line">
                  <Check className="w-3.5 h-3.5 mr-1.5 text-rust shrink-0" />
                  <span>Flexibility to modify dates up to 30 days prior</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Booking Dialog Modal */}
      {bookingOpen && (
        <BookingDialog
          item={pkg}
          defaultDate={travelDate}
          defaultTravelers={travelers}
          onClose={() => setBookingOpen(false)}
          onBooked={handleBooked}
          showPreview={true}
        />
      )}
    </main>
  );
}
