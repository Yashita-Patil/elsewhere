import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Plus } from "lucide-react";
import Button from "../components/ui/Button";
import DestinationForm from "../components/admin/DestinationForm";
import PackageForm from "../components/admin/PackageForm";
import AdminAnalytics from "../components/admin/AdminAnalytics";
import BookingManagement from "../components/admin/BookingManagement";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useModals } from "../context/ModalContext";
import { formatPrice } from "../utils/format";
import usePageTitle from "../utils/usePageTitle";

const ADMIN_TABS = [
  ["analytics", "Overview & Analytics"],
  ["bookings", "Booking Management"],
  ["destinations", "Destinations"],
  ["packages", "Journeys"],
];

// Admin panel: Analytics, Booking Management, Destinations and Journeys.
export default function Admin({ initialTab = "analytics" }) {
  usePageTitle("Admin — Elsewhere");
  const { user, loading, logout } = useAuth();
  const { openLogin } = useModals();

  const [tab, setTab] = useState(initialTab);
  const [destinations, setDestinations] = useState([]);
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  // which popup is open: { type: "destination" | "package", item: existing item or null }
  const [editing, setEditing] = useState(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  const loadData = () =>
    Promise.all([api.get("/destinations"), api.get("/packages"), api.get("/bookings")])
      .then(([d, p, b]) => {
        setDestinations(d);
        setPackages(p);
        setBookings(b);
        setError("");
      })
      .catch((err) => setError(err.message));

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const handleSaved = () => {
    setEditing(null);
    loadData();
  };

  const handleBookingUpdated = (updated) => {
    setBookings((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
  };

  const handleDelete = async (type, item) => {
    const label = type === "destination" ? item.name : item.title;
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/${type === "destination" ? "destinations" : "packages"}/${item._id}`);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="page-message">Loading…</div>;

  if (!isAdmin) {
    return (
      <div className="page-message">
        <div style={{ textAlign: "center", maxWidth: "420px", margin: "0 auto" }}>
          <h2 style={{ marginBottom: "0.5rem" }}>Admin access required</h2>
          <p style={{ color: "var(--muted-foreground)", marginBottom: "1.5rem" }}>
            {user
              ? `You are currently signed in as ${user.email}, which does not have administrator privileges.`
              : "Please sign in with your administrator account to access the control panel."}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            {user ? (
              <Button onClick={() => { logout(); openLogin(); }}>Sign in as Admin</Button>
            ) : (
              <Button onClick={openLogin}>Log in as Admin</Button>
            )}
            <Button asChild variant="outline"><Link to="/">Go to Home</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="admin-page">
      <header className="detail-topbar">
        <Link to="/" className="wordmark" aria-label="Elsewhere home">elsewhere<span>.</span></Link>
        <span className="detail-back">Admin control room</span>
        <Button asChild className="header-plan">
          <Link to="/">View website <ArrowUpRight aria-hidden="true" /></Link>
        </Button>
      </header>

      <div className="admin-body page-wrap">
        <div className="admin-heading-block">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" />Internal Management</p>
            <h1>Admin <em>panel.</em></h1>
          </div>
          <p className="admin-intro">
            Signed in as <strong>{user.email}</strong>.{" "}
            <button className="form-switch" onClick={logout}>Sign out</button>
          </p>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="category-tabs admin-tabs" role="group" aria-label="Admin sections">
          {ADMIN_TABS.map(([key, label]) => (
            <button
              key={key}
              className={tab === key ? "category-tab is-active" : "category-tab"}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "analytics" && (
          <AdminAnalytics onNavigateToBookings={() => setTab("bookings")} />
        )}

        {tab === "bookings" && (
          <BookingManagement
            bookings={bookings}
            onBookingUpdated={handleBookingUpdated}
            onReload={loadData}
          />
        )}

        {tab === "destinations" && (
          <>
            <div className="admin-toolbar">
              <span>{destinations.length} destinations</span>
              <Button className="admin-add" onClick={() => setEditing({ type: "destination", item: null })}>
                <Plus aria-hidden="true" /> Add destination
              </Button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Country</th>
                    <th>Category</th>
                    <th>Days</th>
                    <th>From</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {destinations.map((item) => (
                    <tr key={item._id}>
                      <td><img src={item.image} alt="" /></td>
                      <td>{item.name}</td>
                      <td>{item.country}</td>
                      <td>{item.category}</td>
                      <td>{item.days}</td>
                      <td>{formatPrice(item.from)}</td>
                      <td>
                        <div className="admin-actions">
                          <button onClick={() => setEditing({ type: "destination", item })}>Edit</button>
                          <button className="is-danger" onClick={() => handleDelete("destination", item)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!destinations.length && <tr><td colSpan="7" className="admin-empty">No destinations yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "packages" && (
          <>
            <div className="admin-toolbar">
              <span>{packages.length} journeys</span>
              <Button className="admin-add" onClick={() => setEditing({ type: "package", item: null })}>
                <Plus aria-hidden="true" /> Add journey
              </Button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Title</th>
                    <th>Location</th>
                    <th>Category</th>
                    <th>Days</th>
                    <th>Price</th>
                    <th>Rating</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((item) => (
                    <tr key={item._id}>
                      <td><img src={item.image} alt="" /></td>
                      <td>{item.title}</td>
                      <td>{item.location}</td>
                      <td>{item.category}</td>
                      <td>{item.duration}</td>
                      <td>{formatPrice(item.price)}</td>
                      <td>{item.rating.toFixed(2)}</td>
                      <td>
                        <div className="admin-actions">
                          <button onClick={() => setEditing({ type: "package", item })}>Edit</button>
                          <button className="is-danger" onClick={() => handleDelete("package", item)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!packages.length && <tr><td colSpan="8" className="admin-empty">No journeys yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <DestinationForm
        open={editing?.type === "destination"}
        item={editing?.item ?? null}
        onClose={() => setEditing(null)}
        onSaved={handleSaved}
      />
      <PackageForm
        open={editing?.type === "package"}
        item={editing?.item ?? null}
        destinations={destinations}
        onClose={() => setEditing(null)}
        onSaved={handleSaved}
      />
    </main>
  );
}
