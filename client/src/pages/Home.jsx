import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Search, Star, X } from "lucide-react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import SectionHeading from "../components/SectionHeading";
import EmptyState from "../components/EmptyState";
import DestinationCard from "../components/DestinationCard";
import PackageCard from "../components/PackageCard";
import PlannerDialog from "../components/PlannerDialog";
import BookingDialog from "../components/BookingDialog";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useModals } from "../context/ModalContext";
import { useCurrency } from "../context/CurrencyContext";
import { experiences, experienceToCategory, features, packageCategories } from "../utils/constants";
import usePageTitle from "../utils/usePageTitle";

export default function Home() {
  usePageTitle("Elsewhere — Travel, thoughtfully made");
  const { user, toggleSaved } = useAuth();
  const { openLogin, openDashboard } = useModals();
  const { formatPrice, currency } = useCurrency();

  // ----- search bar at the top -----
  const [searchText, setSearchText] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [travelers, setTravelers] = useState(2);

  // ----- destinations (loaded once, searched in the browser) -----
  const [destinations, setDestinations] = useState([]);
  const [destinationsLoading, setDestinationsLoading] = useState(true);
  const [destinationsError, setDestinationsError] = useState("");
  const [reloadKey, setReloadKey] = useState(0); // change it to fetch again

  // ----- journeys / packages (filtered by the server) -----
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All journeys");
  const [priceLimit, setPriceLimit] = useState("Any price");
  const [durationLimit, setDurationLimit] = useState("Any length");
  const [sortBy, setSortBy] = useState("");
  const [packageQuery, setPackageQuery] = useState("");

  // ----- popups -----
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [bookingPackage, setBookingPackage] = useState(null);
  const [notice, setNotice] = useState("");

  // Load destinations
  useEffect(() => {
    setDestinationsLoading(true);
    api
      .get("/destinations")
      .then((data) => {
        setDestinations(data);
        setDestinationsError("");
      })
      .catch((err) => setDestinationsError(err.message))
      .finally(() => setDestinationsLoading(false));
  }, [reloadKey]);

  // Load packages whenever a filter changes (a short delay avoids a request on every key press)
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCategory !== "All journeys") params.set("category", activeCategory);
    if (priceLimit !== "Any price") params.set("maxPrice", priceLimit);
    if (durationLimit !== "Any length") params.set("maxDays", durationLimit);
    if (packageQuery.trim()) params.set("search", packageQuery.trim());
    if (searchText.trim()) params.set("place", searchText.trim());
    if (sortBy) params.set("sort", sortBy);

    let ignore = false; // skip the answer if a newer request has already started
    const timer = setTimeout(() => {
      api
        .get(`/packages?${params}`)
        .then((data) => {
          if (ignore) return;
          setPackages(data);
          setPackagesError("");
        })
        .catch((err) => !ignore && setPackagesError(err.message))
        .finally(() => !ignore && setPackagesLoading(false));
    }, 250);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [activeCategory, priceLimit, durationLimit, sortBy, packageQuery, searchText, reloadKey]);

  const filteredDestinations = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return destinations;
    return destinations.filter((item) =>
      [item.name, item.country, item.region, item.category].some((value) => value.toLowerCase().includes(query)),
    );
  }, [destinations, searchText]);

  const savedIds = user?.savedPlaces ?? [];

  const handleToggleSaved = async (destination) => {
    if (!user) return openLogin(); // saving needs an account
    try {
      await toggleSaved(destination._id);
    } catch (err) {
      setNotice(err.message);
    }
  };

  const handleBook = (item) => {
    if (!user) return openLogin(); // booking needs an account
    setBookingPackage(item);
  };

  const handleBooked = () => {
    setBookingPackage(null);
    setTimeout(openDashboard, 250); // show the new enquiry in "My trips"
  };

  const handlePlannerSubmit = ({ destination, date, travelers: count, style, budget }) => {
    setSearchText(destination);
    setDateFrom(date);
    setTravelers(count);
    setNotice(`Your ${style.toLowerCase()} journey${budget ? ` · ${budget}` : ""} is ready to explore.`);
    setPlannerOpen(false);
    setTimeout(() => document.getElementById("destinations")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const clearPackageFilters = () => {
    setPackageQuery("");
    setActiveCategory("All journeys");
    setPriceLimit("Any price");
    setDurationLimit("Any length");
    setSortBy("");
    setSearchText("");
  };

  return (
    <main>
      <Header onPlan={() => setPlannerOpen(true)} />

      <Hero
        destinations={destinations}
        searchText={searchText}
        setSearchText={setSearchText}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        travelers={travelers}
        setTravelers={setTravelers}
      />

      <section className="intro-strip page-wrap" aria-label="Elsewhere introduction">
        <p>Not just a trip.<br /><em>A feeling you take home.</em></p>
        <p className="intro-note">Journeys thoughtfully put together,<br />for the places you can’t stop thinking about.</p>
        <span className="intro-mark">E.</span>
      </section>

      {notice && (
        <div className="notice-banner page-wrap" role="status">
          <Check aria-hidden="true" />{notice}
          <button aria-label="Dismiss notice" onClick={() => setNotice("")}><X /></button>
        </div>
      )}

      {/* ===== Destinations ===== */}
      <section className="section-block destinations-section" id="destinations">
        <div className="page-wrap">
          <SectionHeading kicker="A world of possibilities" title={<>Find your <em>somewhere.</em></>} copy="A few places we love, each with a story worth stepping into." />
          <div className="destination-toolbar">
            <span className="results-count">{filteredDestinations.length} places to fall for</span>
            <label className="inline-search">
              <Search aria-hidden="true" />
              <Input aria-label="Search destinations" placeholder="Search places" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
            </label>
          </div>

          {destinationsLoading ? (
            <p className="section-loading">Loading places…</p>
          ) : destinationsError ? (
            <EmptyState title="We can’t reach the server." copy={destinationsError} buttonLabel="Try again" onClear={() => setReloadKey((key) => key + 1)} />
          ) : filteredDestinations.length ? (
            <div className="destination-grid">
              {filteredDestinations.map((destination, index) => (
                <DestinationCard
                  key={destination._id}
                  destination={destination}
                  index={index}
                  total={destinations.length}
                  saved={savedIds.includes(destination._id)}
                  onToggleSaved={handleToggleSaved}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="Somewhere else, perhaps?" copy="We couldn’t find that place just yet. Try another destination." onClear={() => setSearchText("")} />
          )}

          <div className="all-destinations-row">
            <span>Good things happen when you leave room for wonder.</span>
            <a href="#packages">Explore the journeys <ArrowRight aria-hidden="true" /></a>
          </div>
        </div>
      </section>

      {/* ===== Experiences ===== */}
      <section className="experience-section" id="experiences">
        <div className="page-wrap">
          <div className="experience-head">
            <div>
              <p className="eyebrow"><span className="eyebrow-line" />Go by feeling</p>
              <h2>Travel your <em>own way.</em></h2>
            </div>
            <p className="experience-head-copy">There’s no right way to see the world.<br />There’s only the way that feels like yours.</p>
          </div>
          <div className="experience-grid">
            {experiences.map((experience, index) => (
              <a
                href="#packages"
                className={`experience-card experience-card-${index + 1}`}
                key={experience.title}
                onClick={() => setActiveCategory(experienceToCategory[experience.category] ?? experience.category)}
              >
                <img src={experience.image} alt={experience.title} loading="lazy" width={1280} height={960} />
                <span className="experience-wash" />
                <span className="experience-number">0{index + 1}</span>
                <span className="experience-copy">
                  <small>{experience.category}</small>
                  <strong>{experience.title}</strong>
                  <span>{experience.detail} <ArrowUpRight aria-hidden="true" /></span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Journeys (packages) ===== */}
      <section className="section-block packages-section" id="packages">
        <div className="page-wrap">
          <SectionHeading kicker="Made for the moments" title={<>Journeys worth <em>taking.</em></>} copy="Good places. The right people. Nothing between you and the moment." />
          <div className="package-controls">
            <div className="category-tabs" role="group" aria-label="Filter journeys by type">
              {packageCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={activeCategory === category ? "category-tab is-active" : "category-tab"}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="filter-selects">
              <label>
                <span className="sr-only">Maximum price</span>
                <select aria-label="Maximum price" value={priceLimit} onChange={(event) => setPriceLimit(event.target.value)}>
                  <option value="Any price">Any price</option>
                  <option value="1500">Under {formatPrice(1500)}</option>
                  <option value="2000">Under {formatPrice(2000)}</option>
                  <option value="2500">Under {formatPrice(2500)}</option>
                  <option value="3000">Under {formatPrice(3000)}</option>
                  <option value="4000">Under {formatPrice(4000)}</option>
                </select>
                <ChevronDown aria-hidden="true" />
              </label>
              <label>
                <span className="sr-only">Maximum trip length</span>
                <select aria-label="Maximum trip length" value={durationLimit} onChange={(event) => setDurationLimit(event.target.value)}>
                  <option>Any length</option>
                  <option value="6">6 days or less</option>
                  <option value="7">7 days or less</option>
                  <option value="8">8 days or less</option>
                </select>
                <ChevronDown aria-hidden="true" />
              </label>
              <label>
                <span className="sr-only">Sort journeys</span>
                <select aria-label="Sort journeys" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="">Sort: Featured</option>
                  <option value="popular">Top rated</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="shortest">Shortest trip</option>
                </select>
                <ChevronDown aria-hidden="true" />
              </label>
            </div>
          </div>
          <div className="package-search">
            <Search aria-hidden="true" />
            <Input aria-label="Search journeys" placeholder="Search by place, feeling or experience" value={packageQuery} onChange={(event) => setPackageQuery(event.target.value)} />
          </div>

          {packagesLoading ? (
            <p className="section-loading">Loading journeys…</p>
          ) : packagesError ? (
            <EmptyState title="We can’t reach the server." copy={packagesError} buttonLabel="Try again" onClear={() => setReloadKey((key) => key + 1)} />
          ) : packages.length ? (
            <div className="package-grid">
              {packages.map((item) => <PackageCard key={item._id} item={item} onBook={handleBook} />)}
            </div>
          ) : (
            <EmptyState title="No journeys fit just yet." copy="Try a different feeling, price or trip length." onClear={clearPackageFilters} />
          )}
          <p className="price-note">Prices are per person, based on two travelers. Your journey can be made your own.</p>
        </div>
      </section>

      {/* ===== Our approach ===== */}
      <section className="approach-section" id="approach">
        <div className="page-wrap approach-layout">
          <div className="approach-copy">
            <p className="eyebrow"><span className="eyebrow-line" />A different kind of travel company</p>
            <h2>Made for your<br /><em>kind of wonder.</em></h2>
            <p>We believe the best journeys aren’t about ticking things off. They’re about the quiet moments, the people you meet, and the stories you never quite leave behind.</p>
            <a href="#stories" className="text-link">A little more about us <ArrowUpRight aria-hidden="true" /></a>
          </div>
          <div className="approach-features">
            {features.map(({ icon: Icon, title, copy }, index) => (
              <article className="approach-feature" key={title}>
                <div className="feature-icon"><Icon /></div>
                <div>
                  <span className="feature-number">0{index + 1} / HOW WE TRAVEL</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </article>
            ))}
          </div>
          <span className="approach-deco">E</span>
        </div>
      </section>

      {/* ===== Stories ===== */}
      <section className="section-block stories-section" id="stories">
        <div className="page-wrap stories-layout">
          <div className="stories-heading">
            <p className="eyebrow"><span className="eyebrow-line" />Postcards from elsewhere</p>
            <h2>Good trips<br />stay <em>with you.</em></h2>
            <a href="#destinations" className="text-link">Find your own story <ArrowUpRight aria-hidden="true" /></a>
          </div>
          <article className="quote-block">
            <span className="quote-mark">“</span>
            <blockquote>We came home feeling like we’d been let in on a little secret. Every day felt like ours — not like anyone else’s itinerary.</blockquote>
            <div className="quote-footer">
              <div><strong>Amelia & James</strong><span>Amalfi Coast, September ’25</span></div>
              <div className="rating"><span><Star fill="currentColor" aria-hidden="true" /> 5.0</span><span>VERIFIED TRAVELERS</span></div>
            </div>
          </article>
        </div>
      </section>

      {/* ===== Closing banner ===== */}
      <section className="closing-banner" aria-label="Plan a journey">
        <div className="closing-overlay" />
        <div className="page-wrap closing-content">
          <p className="eyebrow">The best time is whenever you’re ready</p>
          <h2>Somewhere is<br /><em>calling.</em></h2>
          <Button className="closing-button" onClick={() => setPlannerOpen(true)}>Let’s find it <ArrowUpRight aria-hidden="true" /></Button>
        </div>
        <span className="closing-caption">YOUR NEXT CHAPTER, OUT THERE</span>
      </section>

      <Footer onPlan={() => setPlannerOpen(true)} />

      <PlannerDialog
        open={plannerOpen}
        onOpenChange={setPlannerOpen}
        destinations={destinations}
        notice={notice}
        onSubmit={handlePlannerSubmit}
        onSelectPackageForBooking={handleBook}
      />
      <BookingDialog
        item={bookingPackage}
        onClose={() => setBookingPackage(null)}
        onBooked={handleBooked}
        defaultDate={dateFrom}
        defaultTravelers={travelers}
        showPreview
      />
    </main>
  );
}
