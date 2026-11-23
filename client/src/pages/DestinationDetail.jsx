import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight, Camera, Check, Compass, Eye, Heart, Hotel, MapPin, Star } from "lucide-react";
import Button from "../components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/Dialog";
import BookingDialog from "../components/BookingDialog";
import CurrencySelector from "../components/CurrencySelector";
import ReviewsSection from "../components/ReviewsSection";
import EmptyState from "../components/EmptyState";
import NotFound from "./NotFound";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useModals } from "../context/ModalContext";
import { useCurrency } from "../context/CurrencyContext";
import usePageTitle from "../utils/usePageTitle";

export default function DestinationDetail() {
  const { slug } = useParams(); // e.g. "bali" from /destinations/bali
  const { user, loading: authLoading, toggleSaved } = useAuth();
  const { openLogin } = useModals();
  const { formatPrice } = useCurrency();

  const [destination, setDestination] = useState(null);
  const [packages, setPackages] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | notfound | error
  const [errorMessage, setErrorMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const [selectedPackage, setSelectedPackage] = useState(null);
  const [bookedMessage, setBookedMessage] = useState("");

  usePageTitle(destination ? `${destination.name}, ${destination.country} — Elsewhere` : "Elsewhere");

  useEffect(() => {
    setStatus("loading");
    Promise.all([api.get(`/destinations/${slug}`), api.get(`/destinations/${slug}/packages`)])
      .then(([destinationData, packageData]) => {
        setDestination(destinationData);
        setPackages(packageData);
        setStatus("ready");
      })
      .catch((err) => {
        setErrorMessage(err.message);
        setStatus(err.status === 404 ? "notfound" : "error");
      });
  }, [slug, retryKey]);

  if (status === "notfound") return <NotFound />;
  if (status === "loading") return <main className="destination-page"><p className="page-message">Loading…</p></main>;
  if (status === "error") {
    return (
      <main className="destination-page">
        <div className="page-wrap" style={{ paddingTop: 80 }}>
          <EmptyState title="We can’t reach the server." copy={errorMessage} buttonLabel="Try again" onClear={() => setRetryKey((key) => key + 1)} />
        </div>
      </main>
    );
  }

  const saved = Boolean(user?.savedPlaces.includes(destination._id));

  const handleSave = async () => {
    if (!user) return openLogin();
    try {
      await toggleSaved(destination._id);
    } catch (err) {
      setBookedMessage(err.message);
    }
  };

  const handleEnquire = (item) => {
    if (!user) return openLogin();
    setSelectedPackage(item);
  };

  const handleBooked = (booking) => {
    setSelectedPackage(null);
    setBookedMessage(`Your enquiry for ${booking.title} has been saved to your account.`);
  };

  return (
    <main className="destination-page">
      <header className="detail-topbar">
        <Link to="/" className="wordmark" aria-label="Elsewhere home">
          elsewhere<span>.</span>
        </Link>
        <div className="detail-topbar-right">
          <CurrencySelector />
          <Button asChild className="header-plan">
            <Link to="/#packages">
              Find your journey <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Navigation below navbar */}
      <div className="detail-subnav-bar">
        <div className="page-wrap">
          <Link to="/#destinations" className="detail-back-link">
            <ArrowLeft aria-hidden="true" /> All destinations
          </Link>
        </div>
      </div>

      <section className="detail-cover" aria-label={`${destination.name}, ${destination.country}`}>
        <img src={destination.image} alt={`${destination.name}, ${destination.country}`} fetchPriority="high" width={1920} height={1200} />
        <span className="detail-cover-shade" />
        <div className="detail-cover-copy">
          <p className="eyebrow"><MapPin aria-hidden="true" />{destination.country} <span>· {destination.region}</span></p>
          <h1>{destination.name}</h1>
          <p>{destination.tagline}</p>
        </div>
        <span className="detail-cover-caption">A PLACE TO FIND YOUR OWN PACE</span>
      </section>

      <section className="detail-intro page-wrap">
        <div className="detail-intro-copy">
          <p className="eyebrow"><span className="eyebrow-line" />A little more about {destination.name}</p>
          <h2>Some places just<br /><em>stay with you.</em></h2>
          <p className="detail-description">{destination.description}</p>
          <div className="detail-highlights">
            {destination.highlights.map((item) => <span key={item}><Check aria-hidden="true" />{item}</span>)}
          </div>
        </div>
        <aside className="detail-fact">
          <span>YOUR JOURNEY, FROM</span>
          <strong>{formatPrice(destination.from)}</strong>
          <span>PER PERSON · {destination.days} DAYS</span>
          <Button variant={saved ? "default" : "outline"} className="detail-save" disabled={authLoading} aria-pressed={saved} onClick={handleSave}>
            <Heart fill={saved ? "currentColor" : "none"} aria-hidden="true" />
            {saved ? "Saved to your places" : "Save this place"}
          </Button>
          <Button asChild className="detail-plan">
            <Link to="/#packages">Explore journeys <ArrowRight aria-hidden="true" /></Link>
          </Button>
        </aside>
      </section>

      {/* Curated Destination Gallery */}
      <section className="detail-gallery page-wrap">
        <img
          src={destination.gallery?.[0] || destination.image}
          alt={`${destination.name} landscape`}
          loading="lazy"
          width={1280}
          height={960}
        />
        <div>
          <span>01 / A SENSE OF PLACE</span>
          <p>Leave room for the moments you didn’t plan.</p>
        </div>
        <img
          src={destination.gallery?.[1] || destination.gallery?.[0] || destination.image}
          alt={`${destination.name}, a closer look`}
          loading="lazy"
          width={1280}
          height={960}
        />
      </section>

      {/* Places You'll Roam */}
      {destination.roamPlaces && destination.roamPlaces.length > 0 && (
        <section className="detail-roam-section page-wrap">
          <div className="section-head-split">
            <div>
              <p className="eyebrow"><Compass size={14} aria-hidden="true" /> Places to roam</p>
              <h2>Iconic sights & <em>hidden trails.</em></h2>
            </div>
            <span className="section-count-tag">{destination.roamPlaces.length} iconic places to roam</span>
          </div>

          <div className="roam-cards-grid">
            {destination.roamPlaces.map((place, idx) => (
              <div className="roam-place-card" key={idx}>
                <div className="roam-card-img-wrap">
                  <img src={place.image} alt={place.name} loading="lazy" />
                  <span className="roam-step-num">0{idx + 1}</span>
                </div>
                <div className="roam-card-info">
                  <h3>{place.name}</h3>
                  <p>{place.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Hospitality & Stays */}
      {destination.hospitality && destination.hospitality.length > 0 && (
        <section className="detail-hospitality-section page-wrap">
          <div className="section-head-split">
            <div>
              <p className="eyebrow"><Hotel size={14} aria-hidden="true" /> Hospitality & stays</p>
              <h2>Spaces made for <em>quiet rest.</em></h2>
            </div>
            <span className="section-count-tag">Handpicked boutique & luxury sanctuaries</span>
          </div>

          <div className="hospitality-cards-grid">
            {destination.hospitality.map((stay, idx) => (
              <div className="hospitality-card" key={idx}>
                <div className="hospitality-card-img-wrap">
                  <img src={stay.image} alt={stay.name} loading="lazy" />
                  <span className="hospitality-type-badge">{stay.type || "Luxury Stay"}</span>
                </div>
                <div className="hospitality-card-info">
                  <div className="hospitality-card-meta">
                    <span className="hospitality-rating">
                      <Star fill="currentColor" size={13} aria-hidden="true" /> {Number(stay.rating || 5).toFixed(1)}
                    </span>
                  </div>
                  <h3>{stay.name}</h3>
                  <p>{stay.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="detail-packages">
        <div className="page-wrap">
          <div className="detail-package-heading">
            <div>
              <p className="eyebrow"><span className="eyebrow-line" />Made for this place</p>
              <h2>Ways to <em>wander.</em></h2>
            </div>
            <span>{packages.length} thoughtfully made {packages.length === 1 ? "journey" : "journeys"}</span>
          </div>
          {packages.length ? (
            <div className="detail-package-grid">
              {packages.map((item) => (
                <article className="detail-package-card" key={item._id}>
                  <Link to={`/packages/${item._id}`}>
                    <img src={item.image} alt={item.location} loading="lazy" width={1280} height={960} />
                  </Link>
                  <div className="detail-package-info">
                    <div className="detail-package-meta">
                      <span>{item.duration} days · {item.category}</span>
                      <span><Star fill="currentColor" aria-hidden="true" /> {Number(item.rating || 5).toFixed(2)}</span>
                    </div>
                    <h3>
                      <Link to={`/packages/${item._id}`} style={{ color: "inherit" }}>
                        {item.title}
                      </Link>
                    </h3>
                    <p>{item.description}</p>
                    <div className="detail-package-bottom">
                      <span>From <strong>{formatPrice(item.price)}</strong> / person</span>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/packages/${item._id}`}>
                            Details <Eye className="w-3.5 h-3.5 ml-1" />
                          </Link>
                        </Button>
                        <Button className="detail-enquire" onClick={() => handleEnquire(item)}>
                          Enquire <ArrowUpRight aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="detail-empty">We’re shaping a journey for this place. Explore the full collection for now.</p>
          )}
          <Link to="/#packages" className="detail-all-link">See every journey <ArrowRight aria-hidden="true" /></Link>
        </div>
      </section>

      {/* Destination Reviews Section */}
      <div className="page-wrap" style={{ marginTop: "3rem", marginBottom: "3rem" }}>
        <ReviewsSection destinationId={destination._id} itemTitle={destination.name} />
      </div>

      <footer className="detail-footer">
        <Link to="/" className="wordmark">elsewhere<span>.</span></Link>
        <span>The world is wide. Go meet it.</span>
        <Link to="/" className="detail-back"><ArrowLeft aria-hidden="true" /> Back to the beginning</Link>
      </footer>

      <BookingDialog item={selectedPackage} onClose={() => setSelectedPackage(null)} onBooked={handleBooked} />

      <Dialog open={Boolean(bookedMessage)} onOpenChange={(open) => !open && setBookedMessage("")}>
        <DialogContent className="travel-dialog">
          <DialogHeader>
            <p className="eyebrow"><span className="eyebrow-line" />A good place to begin</p>
            <DialogTitle>It’s on your list.</DialogTitle>
            <DialogDescription>{bookedMessage}</DialogDescription>
          </DialogHeader>
          <Button className="dialog-submit" onClick={() => setBookedMessage("")}>Lovely, thank you <Check aria-hidden="true" /></Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
