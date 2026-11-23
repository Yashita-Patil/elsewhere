import { useState } from "react";
import { Check, Download, RefreshCw, Search, Trash2 } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import StatusBadge from "../ui/StatusBadge";
import { api } from "../../api";
import { formatDate, formatPrice } from "../../utils/format";

const ALL_STATUSES = ["Upcoming", "Confirmed", "Completed", "Cancelled"];

export default function BookingManagement({ bookings = [], onBookingUpdated, onReload }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const handleStatusChange = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    setError("");
    try {
      const updated = await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      if (onBookingUpdated) {
        onBookingUpdated(updated);
      }
      setToast(`Booking ${updated.bookingCode} status updated to ${newStatus}`);
      setTimeout(() => setToast(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to update booking status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteBooking = async (booking) => {
    if (!window.confirm(`Delete booking ${booking.bookingCode} for "${booking.title}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(booking._id);
    setError("");
    try {
      await api.delete(`/bookings/${booking._id}`);
      if (onReload) onReload();
      setToast(`Booking ${booking.bookingCode} was deleted.`);
      setTimeout(() => setToast(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete booking");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    if (!filteredBookings.length) return;
    const headers = [
      "Booking ID",
      "Customer Name",
      "Customer Email",
      "Journey",
      "Location",
      "Booking Date",
      "Travel Date",
      "Travelers",
      "Total Price (USD)",
      "Status",
    ];

    const rows = filteredBookings.map((b) => [
      `"${b.bookingCode || ""}"`,
      `"${b.user?.name?.replace(/"/g, '""') || "N/A"}"`,
      `"${b.user?.email || "N/A"}"`,
      `"${b.title?.replace(/"/g, '""') || ""}"`,
      `"${b.location?.replace(/"/g, '""') || ""}"`,
      `"${b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ""}"`,
      `"${b.travelDate ? new Date(b.travelDate).toLocaleDateString() : ""}"`,
      b.travelers || 1,
      b.totalPrice || 0,
      `"${b.status || "Upcoming"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `elsewhere-bookings-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter bookings by status and search text
  const filteredBookings = bookings
    .filter((item) => {
      const matchesStatus =
        statusFilter === "All" ||
        (item.status || "").toLowerCase() === statusFilter.toLowerCase();

      if (!matchesStatus) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const code = (item.bookingCode || "").toLowerCase();
      const title = (item.title || "").toLowerCase();
      const location = (item.location || "").toLowerCase();
      const customerName = (item.user?.name || "").toLowerCase();
      const customerEmail = (item.user?.email || "").toLowerCase();

      return (
        code.includes(q) ||
        title.includes(q) ||
        location.includes(q) ||
        customerName.includes(q) ||
        customerEmail.includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === "travelDate") {
        return new Date(a.travelDate || 0) - new Date(b.travelDate || 0);
      }
      if (sortBy === "priceHigh") {
        return (b.totalPrice || 0) - (a.totalPrice || 0);
      }
      if (sortBy === "priceLow") {
        return (a.totalPrice || 0) - (b.totalPrice || 0);
      }
      return 0;
    });

  // Calculate status counts for filter badges
  const counts = {
    All: bookings.length,
    Upcoming: bookings.filter((b) => (b.status || "").toLowerCase() === "upcoming").length,
    Confirmed: bookings.filter((b) => (b.status || "").toLowerCase() === "confirmed").length,
    Completed: bookings.filter((b) => (b.status || "").toLowerCase() === "completed").length,
    Cancelled: bookings.filter((b) => (b.status || "").toLowerCase() === "cancelled").length,
  };

  return (
    <div className="booking-mgmt-section">
      <div className="admin-toolbar booking-mgmt-toolbar">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" />Reservations & Workflow</p>
          <h2 className="admin-subheading">Booking <em>management.</em></h2>
          <span className="booking-count-sub">
            Showing {filteredBookings.length} of {bookings.length} reservations
          </span>
        </div>
        <div className="booking-mgmt-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!filteredBookings.length}
            title="Download CSV"
          >
            <Download aria-hidden="true" /> Export CSV
          </Button>
          {onReload && (
            <Button variant="outline" size="sm" onClick={onReload} title="Reload bookings">
              <RefreshCw aria-hidden="true" /> Refresh
            </Button>
          )}
        </div>
      </div>

      {toast && (
        <div className="booking-toast" role="status" aria-live="polite">
          <Check aria-hidden="true" />
          <span>{toast}</span>
        </div>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}

      {/* Search, Filter, and Sort Bar */}
      <div className="booking-filter-bar">
        <div className="booking-search-wrap">
          <Search className="booking-search-icon" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search code, customer, journey..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="booking-search-input"
          />
        </div>

        <div className="booking-status-filter-pills" role="group" aria-label="Filter bookings by status">
          {["All", ...ALL_STATUSES].map((status) => (
            <button
              key={status}
              type="button"
              className={`filter-pill ${statusFilter === status ? "is-active" : ""}`}
              onClick={() => setStatusFilter(status)}
            >
              <span>{status}</span>
              <span className="pill-count">{counts[status] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="booking-sort-wrap">
          <label htmlFor="booking-sort" className="sr-only">Sort by</label>
          <select
            id="booking-sort"
            className="status-dropdown booking-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Sort: Newest Bookings</option>
            <option value="oldest">Sort: Oldest Bookings</option>
            <option value="travelDate">Sort: Travel Date</option>
            <option value="priceHigh">Sort: Price (High to Low)</option>
            <option value="priceLow">Sort: Price (Low to High)</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="admin-table-wrap booking-table-wrap">
        <table className="admin-table booking-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Customer</th>
              <th>Journey</th>
              <th>Booking Date</th>
              <th>Travel Date</th>
              <th>Travelers</th>
              <th>Price</th>
              <th>Current Status</th>
              <th>Manage Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((item) => {
              const isUpdating = updatingId === item._id;
              const isDeleting = deletingId === item._id;
              return (
                <tr key={item._id} className={isUpdating || isDeleting ? "is-row-updating" : ""}>
                  <td className="booking-code-cell">
                    <span className="booking-code-tag">{item.bookingCode}</span>
                  </td>
                  <td className="booking-customer-cell">
                    {item.user ? (
                      <div className="customer-info">
                        <strong>{item.user.name}</strong>
                        <span>{item.user.email}</span>
                      </div>
                    ) : (
                      <span className="text-muted">Deleted traveler</span>
                    )}
                  </td>
                  <td className="booking-journey-cell">
                    <strong>{item.title}</strong>
                    <span className="journey-location-sub">{item.location}</span>
                  </td>
                  <td className="booking-date-cell">
                    <span className="date-main">{formatDate(item.createdAt || item.travelDate)}</span>
                  </td>
                  <td className="booking-date-cell">
                    <span className="date-main">{formatDate(item.travelDate)}</span>
                  </td>
                  <td>{item.travelers} {item.travelers === 1 ? "guest" : "guests"}</td>
                  <td className="booking-price-cell">{formatPrice(item.totalPrice)}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>
                    <div className="status-select-wrap">
                      <select
                        className="status-dropdown"
                        value={item.status || "Upcoming"}
                        disabled={isUpdating || isDeleting}
                        onChange={(e) => handleStatusChange(item._id, e.target.value)}
                        aria-label={`Change status for ${item.bookingCode}`}
                      >
                        {ALL_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      {isUpdating && <span className="updating-indicator">Saving…</span>}
                    </div>
                  </td>
                  <td>
                    <button
                      className="admin-delete-btn"
                      title="Delete booking"
                      disabled={isUpdating || isDeleting}
                      onClick={() => handleDeleteBooking(item)}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {!filteredBookings.length && (
              <tr>
                <td colSpan="10" className="admin-empty">
                  {bookings.length === 0
                    ? "No customer bookings have been created yet."
                    : "No bookings match your current search, filter, or sorting criteria."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
