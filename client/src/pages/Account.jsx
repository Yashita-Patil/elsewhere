import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  Clock,
  Compass,
  Edit3,
  Globe,
  Heart,
  Lock,
  LogOut,
  Luggage,
  Mail,
  MapPin,
  Phone,
  Settings,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/Dialog";
import AnimatedNumber from "../components/ui/AnimatedNumber";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatPrice } from "../utils/format";
import usePageTitle from "../utils/usePageTitle";

const avatarPresets = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&h=240&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&h=240&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&h=240&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&h=240&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&h=240&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=240&h=240&fit=crop&crop=face",
];

export default function Account() {
  usePageTitle("My Account — Elsewhere");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading, logout, updateProfile, updatePassword, deleteAccount, removeSaved } = useAuth();

  const activeTab = searchParams.get("tab") || "overview";
  const setActiveTab = (tab) => setSearchParams({ tab });

  // Data states
  const [savedDestinations, setSavedDestinations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState("");

  // Modals & sub-dialogs
  const [selectedBooking, setSelectedBooking] = useState(null); // Trip Details
  const [reviewBooking, setReviewBooking] = useState(null); // Review Dialog
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    avatar: "",
    phone: "",
    dob: "",
    gender: "",
    city: "",
    country: "",
    bio: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

  // Delete account state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Trips filter state
  const [tripFilter, setTripFilter] = useState("all"); // all | upcoming | completed | cancelled

  // Load user data on mount
  const loadUserData = async () => {
    if (!user) return;
    setLoadingData(true);
    setDataError("");
    try {
      const [saved, mine] = await Promise.all([api.get("/users/saved"), api.get("/bookings/mine")]);
      setSavedDestinations(saved || []);
      setBookings(mine || []);
    } catch (err) {
      setDataError(err.message || "Could not load your account information");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserData();
      setProfileForm({
        name: user.name || "",
        avatar: user.avatar || "",
        phone: user.phone || "",
        dob: user.dob || "",
        gender: user.gender || "",
        city: user.city || "",
        country: user.country || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  // Statistics
  const stats = useMemo(() => {
    const upcoming = bookings.filter((b) => b.status === "Upcoming").length;
    const completed = bookings.filter((b) => b.status === "Completed").length;
    const cancelled = bookings.filter((b) => b.status === "Cancelled").length;
    return {
      totalTrips: bookings.length,
      upcoming,
      completed,
      cancelled,
      savedPlaces: savedDestinations.length,
    };
  }, [bookings, savedDestinations]);

  // Filtered trips
  const filteredBookings = useMemo(() => {
    if (tripFilter === "upcoming") return bookings.filter((b) => b.status === "Upcoming");
    if (tripFilter === "completed") return bookings.filter((b) => b.status === "Completed");
    if (tripFilter === "cancelled") return bookings.filter((b) => b.status === "Cancelled");
    return bookings;
  }, [bookings, tripFilter]);

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage({ type: "", text: "" });
    try {
      await updateProfile(profileForm);
      setProfileMessage({ type: "success", text: "Your profile has been updated successfully." });
      setIsEditingProfile(false);
    } catch (err) {
      setProfileMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle avatar upload via file picker
  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProfileMessage({ type: "error", text: "Please choose an image under 2MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProfileForm((prev) => ({ ...prev, avatar: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // Handle password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: "", text: "" });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }

    setSavingPassword(true);
    try {
      await updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordMessage({ type: "success", text: "Password changed successfully." });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordMessage({ type: "error", text: err.message || "Could not change password." });
    } finally {
      setSavingPassword(false);
    }
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      navigate("/");
    } catch (err) {
      alert(err.message || "Failed to delete account");
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Handle remove saved destination
  const handleRemoveSaved = async (destinationId) => {
    try {
      await removeSaved(destinationId);
      setSavedDestinations((prev) => prev.filter((d) => d._id !== destinationId));
    } catch (err) {
      alert(err.message || "Could not remove destination");
    }
  };

  // Handle cancel booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this journey enquiry?")) return;
    try {
      const updated = await api.put(`/bookings/${bookingId}/cancel`);
      setBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, status: "Cancelled" } : b)));
      if (selectedBooking?._id === bookingId) {
        setSelectedBooking((prev) => ({ ...prev, status: "Cancelled" }));
      }
    } catch (err) {
      alert(err.message || "Could not cancel booking");
    }
  };

  // Handle submit review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewBooking) return;
    setSubmittingReview(true);
    try {
      const res = await api.post(`/bookings/${reviewBooking._id}/review`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      setBookings((prev) =>
        prev.map((b) => (b._id === reviewBooking._id ? { ...b, review: res.review } : b))
      );
      if (selectedBooking?._id === reviewBooking._id) {
        setSelectedBooking((prev) => ({ ...prev, review: res.review }));
      }
      setReviewBooking(null);
      setReviewComment("");
    } catch (err) {
      alert(err.message || "Could not save review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (authLoading) {
    return (
      <main className="account-page">
        <div className="account-loading-wrap">
          <p className="section-loading">Preparing your account…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="account-page">
        <div className="account-empty-login page-wrap">
          <h2>Welcome to Elsewhere</h2>
          <p>Please log in or create an account to view and manage your travel bookings, saved destinations, and profile.</p>
          <div className="account-empty-actions">
            <Button asChild><Link to="/">Return to Home</Link></Button>
          </div>
        </div>
      </main>
    );
  }

  // Account creation text
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Recent traveler";

  return (
    <main className="account-page">
      {/* Top Navigation Bar */}
      <header className="detail-topbar account-topbar">
        {/* Far Left: Back Arrow + Wordmark + Page Label */}
        <div className="account-topbar-left">
          <button
            type="button"
            className="account-nav-back"
            title="Go Back"
            aria-label="Go Back"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/");
              }
            }}
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>

          <Link to="/" className="wordmark" aria-label="Elsewhere home">
            elsewhere<span>.</span>
          </Link>

          <span className="account-topbar-label">My Account</span>
        </div>

        {/* Far Right: Nav links + Sign Out */}
        <div className="account-topbar-right">
          <Button asChild variant="ghost" size="sm" className="account-home-link">
            <Link to="/#destinations">
              Explore places <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="account-signout-btn"
            title="Sign Out"
          >
            <LogOut size={15} aria-hidden="true" /> Sign out
          </Button>
        </div>
      </header>

      <div className="account-container page-wrap">
        {/* Top Profile Banner */}
        <section className="account-banner-card">
          <div className="account-banner-profile">
            <div className="account-avatar-wrapper">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="account-avatar-img" />
              ) : (
                <div className="account-avatar-placeholder">{user.name.charAt(0).toUpperCase()}</div>
              )}
            </div>
            <div className="account-banner-info">
              <span className="account-badge">Traveler Profile</span>
              <h1>Welcome back, {user.name.split(" ")[0]}</h1>
              <p className="account-banner-sub">
                <span>{user.email}</span>
                {user.city && user.country && <span> · {user.city}, {user.country}</span>}
                <span> · Member since {memberSince}</span>
              </p>
            </div>
          </div>
          <div className="account-banner-actions">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditingProfile(true);
                setActiveTab("profile");
              }}
            >
              <Edit3 aria-hidden="true" /> Edit Profile
            </Button>
          </div>
        </section>

        {/* Dashboard Statistics Cards */}
        <section className="account-stats-grid" aria-label="Account Statistics">
          <div className="stat-card" onClick={() => setActiveTab("trips")}>
            <div className="stat-icon stat-icon-trips">
              <Luggage aria-hidden="true" />
            </div>
            <div className="stat-data">
              <span className="stat-value"><AnimatedNumber value={stats.totalTrips} /></span>
              <span className="stat-label">Total Journeys</span>
            </div>
          </div>

          <div
            className="stat-card"
            onClick={() => {
              setActiveTab("trips");
              setTripFilter("upcoming");
            }}
          >
            <div className="stat-icon stat-icon-upcoming">
              <Clock aria-hidden="true" />
            </div>
            <div className="stat-data">
              <span className="stat-value"><AnimatedNumber value={stats.upcoming} /></span>
              <span className="stat-label">Upcoming Trips</span>
            </div>
          </div>

          <div
            className="stat-card"
            onClick={() => {
              setActiveTab("trips");
              setTripFilter("completed");
            }}
          >
            <div className="stat-icon stat-icon-completed">
              <Check aria-hidden="true" />
            </div>
            <div className="stat-data">
              <span className="stat-value"><AnimatedNumber value={stats.completed} /></span>
              <span className="stat-label">Completed Trips</span>
            </div>
          </div>

          <div className="stat-card" onClick={() => setActiveTab("saved")}>
            <div className="stat-icon stat-icon-saved">
              <Heart aria-hidden="true" />
            </div>
            <div className="stat-data">
              <span className="stat-value"><AnimatedNumber value={stats.savedPlaces} /></span>
              <span className="stat-label">Saved Places</span>
            </div>
          </div>
        </section>

        {/* Main Dashboard Layout: Sidebar + Content */}
        <div className="account-layout">
          {/* Sidebar Navigation */}
          <aside className="account-sidebar">
            <nav className="account-nav-list" aria-label="Dashboard Sections">
              <button
                type="button"
                className={`account-nav-item ${activeTab === "overview" ? "is-active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                <Compass aria-hidden="true" />
                <span>Overview</span>
              </button>

              <button
                type="button"
                className={`account-nav-item ${activeTab === "profile" ? "is-active" : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                <User aria-hidden="true" />
                <span>My Profile</span>
              </button>

              <button
                type="button"
                className={`account-nav-item ${activeTab === "saved" ? "is-active" : ""}`}
                onClick={() => setActiveTab("saved")}
              >
                <Heart aria-hidden="true" />
                <span>Saved Destinations</span>
                {stats.savedPlaces > 0 && <span className="nav-pill">{stats.savedPlaces}</span>}
              </button>

              <button
                type="button"
                className={`account-nav-item ${activeTab === "trips" ? "is-active" : ""}`}
                onClick={() => setActiveTab("trips")}
              >
                <Luggage aria-hidden="true" />
                <span>My Trips</span>
                {stats.totalTrips > 0 && <span className="nav-pill">{stats.totalTrips}</span>}
              </button>

              <button
                type="button"
                className={`account-nav-item ${activeTab === "settings" ? "is-active" : ""}`}
                onClick={() => setActiveTab("settings")}
              >
                <Settings aria-hidden="true" />
                <span>Account Settings</span>
              </button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <section className="account-main-content">
            {dataError && <p className="form-error" role="alert">{dataError}</p>}

            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="tab-pane tab-overview">
                <div className="overview-header-row">
                  <div>
                    <h2>Travel Summary</h2>
                    <p className="pane-subtitle">Your bookings, saved favorites and personal travel history in one place.</p>
                  </div>
                </div>

                {/* Next Upcoming Trip Card */}
                {stats.upcoming > 0 ? (
                  <div className="overview-highlight-card">
                    <span className="eyebrow"><Clock aria-hidden="true" /> Next Adventure</span>
                    {bookings
                      .filter((b) => b.status === "Upcoming")
                      .slice(0, 1)
                      .map((b) => (
                        <div className="highlight-trip-inner" key={b._id}>
                          <div>
                            <h3>{b.title}</h3>
                            <p className="highlight-trip-location"><MapPin aria-hidden="true" /> {b.location}</p>
                            <p className="highlight-trip-dates">
                              Departure: <strong>{formatDate(b.travelDate)}</strong> · {b.travelers} {b.travelers === 1 ? "traveler" : "travelers"}
                            </p>
                          </div>
                          <div className="highlight-trip-actions">
                            <span className="price-tag">{formatPrice(b.totalPrice)}</span>
                            <Button size="sm" onClick={() => setSelectedBooking(b)}>
                              View Journey Details
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="overview-highlight-empty">
                    <div>
                      <h3>No upcoming trips yet</h3>
                      <p>When you enquire about a journey, your itinerary and details will appear here.</p>
                    </div>
                    <Button asChild size="sm">
                      <Link to="/#packages">Discover Journeys <ArrowRight aria-hidden="true" /></Link>
                    </Button>
                  </div>
                )}

                {/* Two Column Grid: Recent Trips + Favorite Places */}
                <div className="overview-columns-grid">
                  {/* Recent Trips Column */}
                  <div className="overview-col-card">
                    <div className="card-head-row">
                      <h4>Recent Trips</h4>
                      <button className="link-subtle" onClick={() => setActiveTab("trips")}>See all</button>
                    </div>
                    {bookings.length ? (
                      <div className="overview-trip-list">
                        {bookings.slice(0, 3).map((trip) => (
                          <div className="overview-trip-item" key={trip._id} onClick={() => setSelectedBooking(trip)}>
                            <div>
                              <strong>{trip.title}</strong>
                              <span className="overview-trip-sub">{trip.location} · {formatDate(trip.travelDate)}</span>
                            </div>
                            <span className={`status-pill ${trip.status === "Cancelled" ? "is-cancelled" : trip.status === "Completed" ? "is-completed" : ""}`}>
                              {trip.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-subtle">No journeys booked yet.</p>
                    )}
                  </div>

                  {/* Saved Destinations Column */}
                  <div className="overview-col-card">
                    <div className="card-head-row">
                      <h4>Saved Destinations</h4>
                      <button className="link-subtle" onClick={() => setActiveTab("saved")}>See all</button>
                    </div>
                    {savedDestinations.length ? (
                      <div className="overview-saved-list">
                        {savedDestinations.slice(0, 3).map((dest) => (
                          <div className="overview-saved-item" key={dest._id}>
                            <img src={dest.image} alt={dest.name} />
                            <div>
                              <Link to={`/destinations/${dest.slug}`} className="saved-title-link">
                                {dest.name}
                              </Link>
                              <span className="overview-trip-sub">{dest.country} · From {formatPrice(dest.from)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-subtle">Heart any destination to save it here.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MY PROFILE & EDIT PROFILE */}
            {activeTab === "profile" && (
              <div className="tab-pane tab-profile">
                <div className="pane-header-actions">
                  <div>
                    <h2>My Profile</h2>
                    <p className="pane-subtitle">Manage your personal information, profile photo and traveler bio.</p>
                  </div>
                  {!isEditingProfile && (
                    <Button onClick={() => setIsEditingProfile(true)}>
                      <Edit3 aria-hidden="true" /> Edit Details
                    </Button>
                  )}
                </div>

                {profileMessage.text && (
                  <div className={`notification-banner ${profileMessage.type === "success" ? "is-success" : "is-error"}`}>
                    {profileMessage.type === "success" ? <Check aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
                    <span>{profileMessage.text}</span>
                  </div>
                )}

                {isEditingProfile ? (
                  /* EDIT PROFILE FORM */
                  <form className="profile-edit-form" onSubmit={handleProfileSubmit}>
                    {/* Avatar selection section */}
                    <div className="edit-avatar-section">
                      <label className="section-label">Profile Photo</label>
                      <div className="avatar-preview-row">
                        <div className="avatar-large-preview">
                          {profileForm.avatar ? (
                            <img src={profileForm.avatar} alt="Avatar preview" />
                          ) : (
                            <span>{profileForm.name ? profileForm.name.charAt(0).toUpperCase() : "U"}</span>
                          )}
                        </div>
                        <div className="avatar-input-controls">
                          <label className="file-upload-btn">
                            <Camera aria-hidden="true" /> Choose photo from device
                            <input type="file" accept="image/*" onChange={handleAvatarFile} />
                          </label>
                          <Input
                            placeholder="Or paste an image URL (e.g. https://...)"
                            value={profileForm.avatar}
                            onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Quick preset avatars */}
                      <p className="preset-label">Or choose an avatar style:</p>
                      <div className="avatar-presets-row">
                        {avatarPresets.map((preset, i) => (
                          <button
                            type="button"
                            key={i}
                            className={`avatar-preset-btn ${profileForm.avatar === preset ? "is-selected" : ""}`}
                            onClick={() => setProfileForm({ ...profileForm, avatar: preset })}
                          >
                            <img src={preset} alt={`Avatar preset ${i + 1}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-fields-grid">
                      <label>
                        Full Name *
                        <Input
                          required
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        />
                      </label>

                      <label>
                        Email Address (Read-only)
                        <Input value={user.email} disabled className="is-disabled" />
                      </label>

                      <label>
                        Phone Number
                        <Input
                          type="tel"
                          placeholder="+1 (555) 019-2834"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        />
                      </label>

                      <label>
                        Date of Birth
                        <Input
                          type="date"
                          value={profileForm.dob}
                          onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                        />
                      </label>

                      <label>
                        Gender
                        <select
                          className="styled-select"
                          value={profileForm.gender}
                          onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                        >
                          <option value="">Prefer not to say</option>
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Non-binary">Non-binary</option>
                        </select>
                      </label>

                      <label>
                        City
                        <Input
                          placeholder="e.g. Mumbai, New York, London"
                          value={profileForm.city}
                          onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        />
                      </label>

                      <label>
                        Country
                        <Input
                          placeholder="e.g. India, United States, France"
                          value={profileForm.country}
                          onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                        />
                      </label>

                      <label className="is-full-width">
                        Personal Traveler Bio
                        <textarea
                          className="styled-textarea"
                          rows={3}
                          placeholder="Share a few words about what you look for when exploring new places…"
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                          maxLength={600}
                        />
                        <span className="char-count">{profileForm.bio.length} / 600 characters</span>
                      </label>
                    </div>

                    <div className="form-submit-row">
                      <Button type="submit" disabled={savingProfile}>
                        {savingProfile ? "Saving…" : "Save Changes"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setProfileMessage({ type: "", text: "" });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* PERSONAL INFORMATION DISPLAY */
                  <div className="profile-display-card">
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label"><User aria-hidden="true" /> Full Name</span>
                        <strong className="info-val">{user.name || "Not provided"}</strong>
                      </div>

                      <div className="info-item">
                        <span className="info-label"><Mail aria-hidden="true" /> Email Address</span>
                        <strong className="info-val">{user.email}</strong>
                      </div>

                      <div className="info-item">
                        <span className="info-label"><Phone aria-hidden="true" /> Phone Number</span>
                        <strong className="info-val">{user.phone || "Not provided"}</strong>
                      </div>

                      <div className="info-item">
                        <span className="info-label"><Clock aria-hidden="true" /> Date of Birth</span>
                        <strong className="info-val">
                          {user.dob ? new Date(user.dob).toLocaleDateString("en-US", { dateStyle: "medium" }) : "Not provided"}
                        </strong>
                      </div>

                      <div className="info-item">
                        <span className="info-label"><User aria-hidden="true" /> Gender</span>
                        <strong className="info-val">{user.gender || "Prefer not to say"}</strong>
                      </div>

                      <div className="info-item">
                        <span className="info-label"><Globe aria-hidden="true" /> Location</span>
                        <strong className="info-val">
                          {user.city || user.country ? `${user.city || ""}${user.city && user.country ? ", " : ""}${user.country || ""}` : "Not provided"}
                        </strong>
                      </div>

                      <div className="info-item is-full-span">
                        <span className="info-label"><Compass aria-hidden="true" /> Personal Bio</span>
                        <p className="info-val info-bio">
                          {user.bio || "No traveler bio added yet. Click 'Edit Details' to introduce yourself."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SAVED DESTINATIONS */}
            {activeTab === "saved" && (
              <div className="tab-pane tab-saved">
                <div className="pane-header-actions">
                  <div>
                    <h2>My Saved Destinations</h2>
                    <p className="pane-subtitle">Places you have bookmarked for future adventures.</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/#destinations">
                      Explore More Destinations <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </div>

                {savedDestinations.length ? (
                  <div className="saved-grid">
                    {savedDestinations.map((destination) => (
                      <article className="saved-destination-card" key={destination._id}>
                        <div className="saved-card-image">
                          <img src={destination.image} alt={destination.name} loading="lazy" />
                          <button
                            type="button"
                            className="remove-saved-pill"
                            title={`Remove ${destination.name}`}
                            onClick={() => handleRemoveSaved(destination._id)}
                          >
                            <Trash2 aria-hidden="true" /> Remove
                          </button>
                        </div>
                        <div className="saved-card-body">
                          <span className="saved-location-tag">
                            <MapPin aria-hidden="true" /> {destination.country} · {destination.region}
                          </span>
                          <h3>{destination.name}</h3>
                          <p className="saved-tagline">{destination.tagline}</p>
                          <div className="saved-card-footer">
                            <span className="saved-price">From {formatPrice(destination.from)}</span>
                            <Button asChild size="sm" variant="ghost">
                              <Link to={`/destinations/${destination.slug}`}>
                                View Details <ArrowUpRight aria-hidden="true" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="account-empty-state">
                    <div className="empty-icon"><Heart aria-hidden="true" /></div>
                    <h3>No saved destinations yet</h3>
                    <p>When you discover a place you love, click the heart button to keep it safely here.</p>
                    <Button asChild>
                      <Link to="/#destinations">Browse All Destinations <ArrowRight aria-hidden="true" /></Link>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: MY TRIPS */}
            {activeTab === "trips" && (
              <div className="tab-pane tab-trips">
                <div className="pane-header-actions">
                  <div>
                    <h2>My Bookings & Journeys</h2>
                    <p className="pane-subtitle">Track your travel enquiries, itineraries and journey reviews.</p>
                  </div>
                  <Button asChild size="sm">
                    <Link to="/#packages">Book a Journey <ArrowUpRight aria-hidden="true" /></Link>
                  </Button>
                </div>

                {/* Filter Tabs */}
                <div className="trip-filter-tabs">
                  <button
                    type="button"
                    className={`filter-btn ${tripFilter === "all" ? "is-active" : ""}`}
                    onClick={() => setTripFilter("all")}
                  >
                    All Trips ({stats.totalTrips})
                  </button>
                  <button
                    type="button"
                    className={`filter-btn ${tripFilter === "upcoming" ? "is-active" : ""}`}
                    onClick={() => setTripFilter("upcoming")}
                  >
                    Upcoming ({stats.upcoming})
                  </button>
                  <button
                    type="button"
                    className={`filter-btn ${tripFilter === "completed" ? "is-active" : ""}`}
                    onClick={() => setTripFilter("completed")}
                  >
                    Completed ({stats.completed})
                  </button>
                  <button
                    type="button"
                    className={`filter-btn ${tripFilter === "cancelled" ? "is-active" : ""}`}
                    onClick={() => setTripFilter("cancelled")}
                  >
                    Cancelled ({stats.cancelled})
                  </button>
                </div>

                {filteredBookings.length ? (
                  <div className="trips-card-list">
                    {filteredBookings.map((b) => {
                      const pkgImage = b.package?.image || "/images/amalfi-coast.jpg";
                      return (
                        <article className="trip-history-card" key={b._id}>
                          <img src={pkgImage} alt={b.title} className="trip-card-thumb" />
                          <div className="trip-card-info">
                            <div className="trip-head-line">
                              <div>
                                <span className="trip-code">Booking #{b.bookingCode}</span>
                                <h3>{b.title}</h3>
                                <p className="trip-loc"><MapPin aria-hidden="true" /> {b.location}</p>
                              </div>
                              <span
                                className={`status-pill ${
                                  b.status === "Cancelled" ? "is-cancelled" : b.status === "Completed" ? "is-completed" : ""
                                }`}
                              >
                                {b.status}
                              </span>
                            </div>

                            <div className="trip-meta-row">
                              <span><strong>Departure:</strong> {formatDate(b.travelDate)}</span>
                              <span><strong>Travelers:</strong> {b.travelers}</span>
                              <span><strong>Total:</strong> {formatPrice(b.totalPrice)}</span>
                            </div>

                            {/* Review badge if already reviewed */}
                            {b.review?.rating && (
                              <div className="trip-review-badge">
                                <span>Your Review:</span>
                                <div className="stars-row">
                                  {[...Array(b.review.rating)].map((_, i) => (
                                    <Star key={i} size={14} fill="currentColor" />
                                  ))}
                                </div>
                                <span className="review-quote">“{b.review.comment}”</span>
                              </div>
                            )}

                            <div className="trip-actions-row">
                              <Button size="sm" onClick={() => setSelectedBooking(b)}>
                                View Details
                              </Button>

                              {b.status === "Completed" && !b.review?.rating && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setReviewBooking(b);
                                    setReviewRating(5);
                                    setReviewComment("");
                                  }}
                                >
                                  <Star size={14} aria-hidden="true" /> Write a Review
                                </Button>
                              )}

                              {b.status === "Upcoming" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="cancel-link"
                                  onClick={() => handleCancelBooking(b._id)}
                                >
                                  Cancel Enquiry
                                </Button>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="account-empty-state">
                    <div className="empty-icon"><Luggage aria-hidden="true" /></div>
                    <h3>No {tripFilter !== "all" ? tripFilter : ""} journeys found</h3>
                    <p>Ready to plan your next chapter? Our curated journeys are thoughtfully crafted for memories that last.</p>
                    <Button asChild>
                      <Link to="/#packages">Browse All Journeys <ArrowRight aria-hidden="true" /></Link>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: ACCOUNT SETTINGS */}
            {activeTab === "settings" && (
              <div className="tab-pane tab-settings">
                <h2>Account Settings</h2>
                <p className="pane-subtitle">Manage your login security and account preferences.</p>

                {passwordMessage.text && (
                  <div className={`notification-banner ${passwordMessage.type === "success" ? "is-success" : "is-error"}`}>
                    {passwordMessage.type === "success" ? <Check aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
                    <span>{passwordMessage.text}</span>
                  </div>
                )}

                {/* Change Password Card */}
                <div className="settings-card">
                  <div className="settings-card-head">
                    <Lock aria-hidden="true" />
                    <div>
                      <h3>Change Password</h3>
                      <p>Update your password to keep your account secure.</p>
                    </div>
                  </div>

                  <form className="password-form" onSubmit={handlePasswordSubmit}>
                    <div className="password-fields-grid">
                      <label>
                        Current Password
                        <Input
                          type="password"
                          required
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        />
                      </label>

                      <label>
                        New Password (Min. 6 characters)
                        <Input
                          type="password"
                          required
                          minLength={6}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        />
                      </label>

                      <label>
                        Confirm New Password
                        <Input
                          type="password"
                          required
                          minLength={6}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        />
                      </label>
                    </div>

                    <Button type="submit" disabled={savingPassword}>
                      {savingPassword ? "Updating…" : "Update Password"}
                    </Button>
                  </form>
                </div>

                {/* Danger Zone: Delete Account */}
                <div className="settings-card danger-zone">
                  <div className="settings-card-head">
                    <AlertTriangle aria-hidden="true" />
                    <div>
                      <h3>Danger Zone</h3>
                      <p>Permanently remove your personal profile, saved places, and journey history.</p>
                    </div>
                  </div>
                  <div className="danger-zone-footer">
                    <p className="danger-note">Once deleted, your account cannot be recovered. All enquiries and saved places will be erased.</p>
                    <Button variant="outline" className="danger-btn" onClick={() => setDeleteDialogOpen(true)}>
                      <Trash2 aria-hidden="true" /> Delete My Account
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* TRIP DETAILS MODAL */}
      <Dialog open={Boolean(selectedBooking)} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="travel-dialog trip-detail-dialog">
          {selectedBooking && (
            <>
              <DialogHeader>
                <div className="dialog-kicker">
                  <span>Booking Code: {selectedBooking.bookingCode}</span>
                  <span
                    className={`status-pill ${
                      selectedBooking.status === "Cancelled" ? "is-cancelled" : selectedBooking.status === "Completed" ? "is-completed" : ""
                    }`}
                  >
                    {selectedBooking.status}
                  </span>
                </div>
                <DialogTitle>{selectedBooking.title}</DialogTitle>
                <DialogDescription>{selectedBooking.location}</DialogDescription>
              </DialogHeader>

              <div className="trip-modal-scroll">
                {/* Key Summary Bar */}
                <div className="modal-summary-grid">
                  <div>
                    <span className="summary-label">Departure Date</span>
                    <strong>{formatDate(selectedBooking.travelDate)}</strong>
                  </div>
                  <div>
                    <span className="summary-label">Party Size</span>
                    <strong>{selectedBooking.travelers} {selectedBooking.travelers === 1 ? "Traveler" : "Travelers"}</strong>
                  </div>
                  <div>
                    <span className="summary-label">Total Amount</span>
                    <strong>{formatPrice(selectedBooking.totalPrice)}</strong>
                  </div>
                  <div>
                    <span className="summary-label">Payment Status</span>
                    <strong className="status-confirmed"><Check aria-hidden="true" /> Confirmed Enquiry</strong>
                  </div>
                </div>

                {/* Inclusions Detail Sections */}
                <div className="modal-inclusions-list">
                  <div className="inclusion-row">
                    <strong>Accommodation:</strong>
                    <span>{selectedBooking.hotel || "4-star Boutique Hotel & Heritage Stay"}</span>
                  </div>

                  <div className="inclusion-row">
                    <strong>Transportation:</strong>
                    <span>{selectedBooking.transport || "Private chauffeured transfers & local scenic transfers"}</span>
                  </div>

                  <div className="inclusion-row">
                    <strong>Meals & Dining:</strong>
                    <span>{selectedBooking.meals || "Daily artisan breakfast & welcome traditional dinner"}</span>
                  </div>

                  {selectedBooking.activities?.length > 0 && (
                    <div className="inclusion-group">
                      <strong>Curated Activities & Highlights:</strong>
                      <ul>
                        {selectedBooking.activities.map((act, i) => (
                          <li key={i}><Check size={14} aria-hidden="true" /> {act}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="inclusion-group">
                    <strong>All Inclusions:</strong>
                    <ul>
                      {(selectedBooking.inclusions || [
                        "Private accommodation with breakfast included",
                        "All scenic ground transfers & airport reception",
                        "Local host experiences & museum/temple entries",
                        "24/7 dedicated travel concierge",
                      ]).map((inc, i) => (
                        <li key={i}><Check size={14} aria-hidden="true" /> {inc}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Review if exists */}
                {selectedBooking.review?.rating && (
                  <div className="modal-review-box">
                    <h4>Your Journey Review</h4>
                    <div className="stars-row">
                      {[...Array(selectedBooking.review.rating)].map((_, i) => (
                        <Star key={i} size={15} fill="currentColor" />
                      ))}
                    </div>
                    <p>“{selectedBooking.review.comment}”</p>
                  </div>
                )}
              </div>

              <div className="modal-footer-actions">
                {selectedBooking.status === "Upcoming" && (
                  <Button
                    variant="outline"
                    className="cancel-link"
                    onClick={() => handleCancelBooking(selectedBooking._id)}
                  >
                    Cancel Journey
                  </Button>
                )}
                {selectedBooking.status === "Completed" && !selectedBooking.review?.rating && (
                  <Button
                    onClick={() => {
                      setReviewBooking(selectedBooking);
                      setReviewRating(5);
                      setReviewComment("");
                    }}
                  >
                    <Star size={14} aria-hidden="true" /> Review Journey
                  </Button>
                )}
                <Button onClick={() => setSelectedBooking(null)}>Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* WRITE A REVIEW MODAL */}
      <Dialog open={Boolean(reviewBooking)} onOpenChange={(open) => !open && setReviewBooking(null)}>
        <DialogContent className="travel-dialog">
          {reviewBooking && (
            <form onSubmit={handleReviewSubmit}>
              <DialogHeader>
                <DialogTitle>Review your journey</DialogTitle>
                <DialogDescription>{reviewBooking.title} · {reviewBooking.location}</DialogDescription>
              </DialogHeader>

              <div className="review-dialog-body">
                <label className="rating-select-label">
                  Your Rating
                  <div className="star-picker">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        className={`star-pick-btn ${star <= reviewRating ? "is-filled" : ""}`}
                        onClick={() => setReviewRating(star)}
                        aria-label={`${star} star${star > 1 ? "s" : ""}`}
                      >
                        <Star fill={star <= reviewRating ? "currentColor" : "none"} />
                      </button>
                    ))}
                    <span className="rating-num-label">{reviewRating} / 5 Stars</span>
                  </div>
                </label>

                <label>
                  Tell us about your experience
                  <textarea
                    required
                    className="styled-textarea"
                    rows={4}
                    placeholder="How was the route, the local hosts, and the stillness of the place?"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </label>
              </div>

              <div className="modal-footer-actions">
                <Button type="button" variant="outline" onClick={() => setReviewBooking(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingReview}>
                  {submittingReview ? "Submitting…" : "Publish Review"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="travel-dialog delete-confirm-dialog">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete your account (<strong>{user.email}</strong>)? This action cannot be reversed.
            </DialogDescription>
          </DialogHeader>
          <div className="delete-dialog-actions">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Keep Account
            </Button>
            <Button className="danger-submit-btn" disabled={deleting} onClick={handleDeleteAccount}>
              {deleting ? "Deleting…" : "Yes, Delete Everything"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

