import { ArrowUpRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useModals } from "../context/ModalContext";

export default function Footer({ onPlan }) {
  const { user } = useAuth();
  const { openLogin, openDashboard } = useModals();

  return (
    <footer className="site-footer">
      <div className="page-wrap">
        <div className="footer-main">
          <div className="footer-brand">
            <a href="#home" className="wordmark">elsewhere<span>.</span></a>
            <p>The world is wide.<br />Go meet it.</p>
          </div>
          <div className="footer-links">
            <div>
              <span>Go somewhere</span>
              <a href="#destinations">Destinations</a>
              <a href="#experiences">Experiences</a>
              <a href="#packages">Journeys</a>
            </div>
            <div>
              <span>Get to know us</span>
              <a href="#approach">Our approach</a>
              <a href="#stories">Traveler stories</a>
              <button onClick={() => (user ? openDashboard() : openLogin())}>
                {user ? "My trips" : "Traveler login"}
              </button>
            </div>
            <div>
              <span>Say hello</span>
              <button onClick={onPlan}>Ask us about a journey <ArrowUpRight aria-hidden="true" /></button>
              <span className="footer-socials">
                <a href="https://www.instagram.com/" aria-label="Instagram" target="_blank" rel="noreferrer">ig</a>
                <a href="https://www.pinterest.com/" aria-label="Pinterest" target="_blank" rel="noreferrer">p</a>
                <a href="https://www.linkedin.com/" aria-label="LinkedIn" target="_blank" rel="noreferrer">in</a>
              </span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 ELSEWHERE TRAVEL CO.</span>
          <span>THOUGHTFULLY, ALWAYS.</span>
          <a href="#home">Back to the beginning <ArrowUpRight aria-hidden="true" /></a>
        </div>
      </div>
    </footer>
  );
}
