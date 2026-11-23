import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Button from "./ui/Button";
import { useAuth } from "../context/AuthContext";
import { useModals } from "../context/ModalContext";

const navLinks = [
  { label: "Destinations", href: "#destinations" },
  { label: "Experiences", href: "#experiences" },
  { label: "Our approach", href: "#approach" },
  { label: "Stories", href: "#stories" },
];

export default function Header({ onPlan }) {
  const { user } = useAuth();
  const { openLogin, openDashboard } = useModals();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openAccount = () => (user ? openDashboard() : openLogin());

  return (
    <header className="site-header">
      <a href="#home" className="wordmark" aria-label="Elsewhere home">
        elsewhere<span>.</span>
      </a>

      <nav className="desktop-nav" aria-label="Main navigation">
        {navLinks.map((link) => (
          <a key={link.href} href={link.href}>{link.label}</a>
        ))}
      </nav>

      <div className="header-actions">
        {user?.role === "admin" && (
          <Link to="/admin" className="header-login header-admin">Admin</Link>
        )}
        {user ? (
          <Button variant="ghost" className="header-login" onClick={openDashboard}>
            <span className="user-initial">{user.name.charAt(0).toUpperCase()}</span> My trips
          </Button>
        ) : (
          <Button variant="ghost" className="header-login" onClick={openLogin}>Log in</Button>
        )}
        <Button className="header-plan" onClick={onPlan}>
          Plan your trip <ArrowUpRight aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="mobile-menu-button"
          aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {mobileMenuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>{link.label}</a>
          ))}
          {user?.role === "admin" && <Link to="/admin">Admin</Link>}
          <button onClick={() => { setMobileMenuOpen(false); openAccount(); }}>
            {user ? "My trips" : "Log in"}
          </button>
        </nav>
      )}
    </header>
  );
}
