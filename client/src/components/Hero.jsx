import { ArrowDownRight, ArrowRight, CalendarDays, ChevronDown, Search, UsersRound } from "lucide-react";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { travelerOptions } from "../utils/constants";

export default function Hero({ destinations, searchText, setSearchText, dateFrom, setDateFrom, travelers, setTravelers }) {
  const handleSearch = (event) => {
    event.preventDefault();
    document.getElementById("destinations")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-shade" />
      <div className="hero-content page-wrap">
        <p className="eyebrow hero-eyebrow"><span className="eyebrow-line" />For the love of going</p>
        <h1 id="hero-title">THE WORLD,<br /><em>WIDER.</em></h1>
        <p className="hero-copy">See more than the sights.<br />Find the feeling you came for.</p>
        <a href="#destinations" className="hero-discover">
          Discover your somewhere <span><ArrowDownRight aria-hidden="true" /></span>
        </a>
      </div>
      <div className="hero-caption"><span>POSITANO, ITALY</span><span>40°37′43″N &nbsp; 14°29′09″E</span></div>
      <span className="hero-index">01 / 06</span>

      <form className="search-bar page-wrap" onSubmit={handleSearch} aria-label="Find your next journey">
        <label className="search-field search-location">
          <span>Going somewhere?</span>
          <span className="search-input-wrap">
            <Search aria-hidden="true" />
            <Input
              aria-label="Destination"
              placeholder="Try 'Japan' or 'the sea'"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              list="destination-options"
            />
            <datalist id="destination-options">
              {destinations.map((item) => <option key={item.slug} value={item.name} />)}
            </datalist>
          </span>
        </label>

        <label className="search-field">
          <span>When</span>
          <span className="search-input-wrap">
            <CalendarDays aria-hidden="true" />
            <Input aria-label="Travel date" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </span>
        </label>

        <label className="search-field search-travelers">
          <span>Who’s coming?</span>
          <span className="search-input-wrap">
            <UsersRound aria-hidden="true" />
            <select aria-label="Number of travelers" value={travelers} onChange={(event) => setTravelers(Number(event.target.value))}>
              {travelerOptions.map((count) => (
                <option key={count} value={count}>{count} {count === 1 ? "traveler" : "travelers"}</option>
              ))}
            </select>
            <ChevronDown className="select-chevron" aria-hidden="true" />
          </span>
        </label>

        <Button type="submit" className="search-submit" aria-label="Search journeys"><ArrowRight aria-hidden="true" /></Button>
      </form>
    </section>
  );
}
