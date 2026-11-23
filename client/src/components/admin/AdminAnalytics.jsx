import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, RefreshCw, TrendingUp } from "lucide-react";
import Button from "../ui/Button";
import AnimatedNumber from "../ui/AnimatedNumber";
import { api } from "../../api";
import { formatPrice } from "../../utils/format";

export default function AdminAnalytics({ onNavigateToBookings }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/bookings/stats");
      setStats(data);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="analytics-loading" aria-live="polite">
        <div className="analytics-spinner" />
        <p>Curating travel analytics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error" role="alert">
        <p className="form-error">{error}</p>
        <Button variant="outline" size="sm" onClick={loadStats}>
          <RefreshCw aria-hidden="true" /> Retry
        </Button>
      </div>
    );
  }

  const {
    totalBookings = 0,
    totalRevenue = 0,
    averageBookingValue = 0,
    statusCounts = { Upcoming: 0, Confirmed: 0, Completed: 0, Cancelled: 0 },
    mostBookedJourneys = [],
  } = stats || {};

  const maxBookings = Math.max(
    ...mostBookedJourneys.map((j) => j.bookingCount),
    1
  );

  const activeReservations = (statusCounts.Confirmed || 0) + (statusCounts.Upcoming || 0);

  return (
    <div className="analytics-section">
      {/* Editorial Header */}
      <div className="analytics-header">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" />Performance & Insights</p>
          <h2 className="analytics-title">Executive <em>summary.</em></h2>
          <p className="analytics-subtitle">
            Live overview of booking volume, realized revenue, and journey demand across Elsewhere.
          </p>
        </div>
        <div className="analytics-actions">
          <Button variant="outline" size="sm" onClick={loadStats} title="Refresh data">
            <RefreshCw aria-hidden="true" /> Refresh
          </Button>
          {onNavigateToBookings && (
            <Button size="sm" onClick={onNavigateToBookings}>
              Manage bookings <ArrowRight aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="analytics-kpi-grid">
        <div className="analytics-kpi-card">
          <span className="kpi-eyebrow">Total Volume</span>
          <div className="kpi-value"><AnimatedNumber value={totalBookings} /></div>
          <span className="kpi-label">Total Reservations</span>
          <p className="kpi-detail">All-time traveler enquiries and bookings</p>
        </div>

        <div className="analytics-kpi-card is-highlight">
          <span className="kpi-eyebrow">Net Realized</span>
          <div className="kpi-value"><AnimatedNumber value={totalRevenue} prefix="$" /></div>
          <span className="kpi-label">Total Revenue</span>
          <p className="kpi-detail">Excludes cancelled & unpaid reservations</p>
        </div>

        <div className="analytics-kpi-card">
          <span className="kpi-eyebrow">Pipeline</span>
          <div className="kpi-value"><AnimatedNumber value={activeReservations} /></div>
          <span className="kpi-label">Active Journeys</span>
          <p className="kpi-detail">
            {statusCounts.Upcoming || 0} upcoming · {statusCounts.Confirmed || 0} confirmed
          </p>
        </div>

        <div className="analytics-kpi-card">
          <span className="kpi-eyebrow">Average Booking</span>
          <div className="kpi-value">{formatPrice(averageBookingValue)}</div>
          <span className="kpi-label">Average Order Value</span>
          <p className="kpi-detail">Calculated across active bookings</p>
        </div>
      </div>

      {/* Status Distribution Pills */}
      <div className="analytics-status-breakdown">
        <div className="status-breakdown-card">
          <div className="status-breakdown-header">
            <span className="status-dot dot-upcoming" />
            <span className="status-title">Upcoming</span>
          </div>
          <div className="status-count">{statusCounts.Upcoming || 0}</div>
          <span className="status-percent">
            {totalBookings ? Math.round(((statusCounts.Upcoming || 0) / totalBookings) * 100) : 0}% of total
          </span>
        </div>

        <div className="status-breakdown-card">
          <div className="status-breakdown-header">
            <span className="status-dot dot-confirmed" />
            <span className="status-title">Confirmed</span>
          </div>
          <div className="status-count">{statusCounts.Confirmed || 0}</div>
          <span className="status-percent">
            {totalBookings ? Math.round(((statusCounts.Confirmed || 0) / totalBookings) * 100) : 0}% of total
          </span>
        </div>

        <div className="status-breakdown-card">
          <div className="status-breakdown-header">
            <span className="status-dot dot-completed" />
            <span className="status-title">Completed</span>
          </div>
          <div className="status-count">{statusCounts.Completed || 0}</div>
          <span className="status-percent">
            {totalBookings ? Math.round(((statusCounts.Completed || 0) / totalBookings) * 100) : 0}% of total
          </span>
        </div>

        <div className="status-breakdown-card">
          <div className="status-breakdown-header">
            <span className="status-dot dot-cancelled" />
            <span className="status-title">Cancelled</span>
          </div>
          <div className="status-count">{statusCounts.Cancelled || 0}</div>
          <span className="status-percent">
            {totalBookings ? Math.round(((statusCounts.Cancelled || 0) / totalBookings) * 100) : 0}% of total
          </span>
        </div>
      </div>

      {/* Most Booked Journeys Chart */}
      <div className="analytics-chart-container">
        <div className="chart-header">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" />Curated Demand</p>
            <h3 className="chart-title">Most Booked <em>Journeys.</em></h3>
            <p className="chart-subtitle">
              Ranked by total customer bookings via MongoDB aggregation
            </p>
          </div>
          <div className="chart-badge">
            <BarChart3 aria-hidden="true" />
            <span>Top {mostBookedJourneys.length} packages</span>
          </div>
        </div>

        {mostBookedJourneys.length === 0 ? (
          <div className="analytics-empty">
            <p>No journey bookings recorded yet.</p>
            <span>Once customers book travel packages, booking frequency will render here.</span>
          </div>
        ) : (
          <>
            {/* SVG Visual Column Bar Chart */}
            <div className="svg-chart-wrap" aria-label="Most booked journeys bar chart">
              <svg viewBox="0 0 700 220" className="editorial-bar-chart" preserveAspectRatio="xMidYMid meet">
                {/* Horizontal reference grid lines */}
                <line x1="45" y1="35" x2="685" y2="35" stroke="var(--border)" strokeDasharray="3 3" />
                <line x1="45" y1="105" x2="685" y2="105" stroke="var(--border)" strokeDasharray="3 3" />
                <line x1="45" y1="175" x2="685" y2="175" stroke="var(--border)" />

                {/* Y-Axis values */}
                <text x="36" y="39" className="chart-axis-text" textAnchor="end">{maxBookings}</text>
                <text x="36" y="109" className="chart-axis-text" textAnchor="end">{Math.max(1, Math.round(maxBookings / 2))}</text>
                <text x="36" y="179" className="chart-axis-text" textAnchor="end">0</text>

                {/* Vertical Bars */}
                {mostBookedJourneys.map((item, i) => {
                  const count = mostBookedJourneys.length;
                  const barWidth = Math.min(52, Math.max(34, 400 / (count || 1)));
                  const availableWidth = 630;
                  const slotWidth = availableWidth / count;
                  const x = 55 + i * slotWidth + (slotWidth - barWidth) / 2;
                  const barHeight = Math.max((item.bookingCount / maxBookings) * 135, 6);
                  const y = 175 - barHeight;

                  // Label: first 2 words of name
                  const shortName = (item.name || "").split(" ").slice(0, 2).join(" ");

                  return (
                    <g key={item._id || item.packageId || i} className="chart-bar-group">
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx="2"
                        className="chart-svg-bar"
                      >
                        <title>{`${item.name}: ${item.bookingCount} bookings (${formatPrice(item.totalRevenue)})`}</title>
                      </rect>
                      <text
                        x={x + barWidth / 2}
                        y={y - 7}
                        textAnchor="middle"
                        className="chart-bar-val"
                      >
                        {item.bookingCount}
                      </text>
                      <text
                        x={x + barWidth / 2}
                        y="196"
                        textAnchor="middle"
                        className="chart-bar-label"
                      >
                        {shortName}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Detailed Ranked Packages List */}
            <div className="chart-bars-list">
              {mostBookedJourneys.map((item, idx) => {
                const percentage = Math.round((item.bookingCount / maxBookings) * 100);
                return (
                  <div className="chart-bar-row" key={item._id || item.packageId || idx}>
                    <div className="bar-info">
                      {item.image && (
                        <img src={item.image} alt="" className="bar-thumb" />
                      )}
                      <div className="bar-labels">
                        <span className="bar-journey-name">{item.name}</span>
                        <span className="bar-journey-location">{item.location}</span>
                      </div>
                    </div>

                    <div className="bar-track-wrap">
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${percentage}%` }}
                          role="progressbar"
                          aria-valuenow={item.bookingCount}
                          aria-valuemin={0}
                          aria-valuemax={maxBookings}
                        />
                      </div>
                      <div className="bar-metrics">
                        <span className="bar-count">
                          <strong>{item.bookingCount}</strong> {item.bookingCount === 1 ? "booking" : "bookings"}
                        </span>
                        <span className="bar-revenue">
                          {formatPrice(item.totalRevenue)} revenue
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
