import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/Dialog";
import Button from "./ui/Button";
import StatusBadge from "./ui/StatusBadge";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useModals } from "../context/ModalContext";
import { useCurrency } from "../context/CurrencyContext";
import { formatDate } from "../utils/format";

// The "My trips" popup: saved places + booking enquiries
export default function DashboardDialog() {
  const { user, logout, toggleSaved } = useAuth();
  const { dashboardOpen, setDashboardOpen } = useModals();
  const { formatPrice } = useCurrency();
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  // Load fresh data from the database every time the popup opens
  useEffect(() => {
    if (!dashboardOpen || !user) return;
    setError("");
    Promise.all([api.get("/users/saved"), api.get("/bookings/mine")])
      .then(([saved, mine]) => {
        setSavedPlaces(saved);
        setBookings(mine);
      })
      .catch((err) => setError(err.message));
  }, [dashboardOpen, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const removeSaved = async (destinationId) => {
    try {
      await toggleSaved(destinationId);
      setSavedPlaces((list) => list.filter((place) => place._id !== destinationId));
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelBooking = async (id) => {
    try {
      const updated = await api.put(`/bookings/${id}/cancel`);
      setBookings((list) => list.map((booking) => (booking._id === id ? updated : booking)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignOut = () => {
    logout();
    setDashboardOpen(false);
  };

  if (!user) return null;

  return (
    <Dialog open={dashboardOpen} onOpenChange={setDashboardOpen}>
      <DialogContent className="travel-dialog dashboard-dialog">
        <DialogHeader>
          <p className="eyebrow"><span className="eyebrow-line" />Your travel book</p>
          <DialogTitle>Hello, {user.name.split(" ")[0]}.</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        {user?.role === "admin" && (
          <div style={{ margin: "0.75rem 0", padding: "0.75rem 1rem", background: "rgba(0,0,0,0.04)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.9rem" }}>Signed in with <strong>Administrator</strong> privileges</span>
            <Button asChild onClick={() => setDashboardOpen(false)}>
              <Link to="/admin">Go to Admin Panel <ArrowUpRight aria-hidden="true" /></Link>
            </Button>
          </div>
        )}

        <div className="dashboard-content">
          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="dashboard-section-title"><h3>Saved places</h3><span>{savedPlaces.length}</span></div>
          {savedPlaces.length ? (
            <div className="saved-list">
              {savedPlaces.map((place) => (
                <div className="saved-row" key={place._id}>
                  <img src={place.image} alt="" width={1280} height={960} />
                  <div><strong>{place.name}</strong><span>{place.country}</span></div>
                  <Button variant="ghost" size="icon" aria-label={`Remove ${place.name}`} onClick={() => removeSaved(place._id)}>
                    <X aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">The places you save will find a home here.</p>
          )}

          <div className="dashboard-section-title booking-title">
            <h3>Trip enquiries</h3>
            <span>{bookings.filter((item) => ["Upcoming", "Confirmed"].includes(item.status)).length} active</span>
          </div>
          {bookings.length ? (
            <div className="booking-list">
              {bookings.map((booking) => (
                <div className="booking-row" key={booking._id}>
                  <div className="booking-row-heading">
                    <div>
                      <strong>{booking.title}</strong>
                      <span>{booking.location} · {booking.bookingCode}</span>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="booking-row-meta">
                    <span>{formatDate(booking.travelDate)} · {booking.travelers} travelers</span>
                    <span>{formatPrice(booking.totalPrice)}</span>
                  </div>
                  {["Upcoming", "Confirmed"].includes(booking.status) && (
                    <Button variant="ghost" className="cancel-booking" onClick={() => cancelBooking(booking._id)}>Cancel enquiry</Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">Your next story is waiting to be written.</p>
          )}

          <Button variant="ghost" className="signout-button" onClick={handleSignOut}>Sign out</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
