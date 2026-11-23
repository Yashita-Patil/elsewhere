import { useState, useEffect } from "react";
import { Star, MessageSquare, ThumbsUp, Edit2, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useModals } from "../context/ModalContext";
import StarRating from "./StarRating";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { formatDate } from "../utils/format";

export default function ReviewsSection({
  packageId,
  destinationId,
  itemTitle = "this journey",
  onRatingUpdate,
}) {
  const { user } = useAuth();
  const { openLogin } = useModals();

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 5.0,
    totalReviews: 0,
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // Load reviews
  const fetchReviews = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (packageId) params.set("package", packageId);
      if (destinationId) params.set("destination", destinationId);

      const data = await api.get(`/reviews?${params.toString()}`);
      setReviews(data.reviews || []);
      setStats({
        averageRating: data.averageRating ?? 5.0,
        totalReviews: data.totalReviews ?? 0,
        ratingBreakdown: data.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
      if (onRatingUpdate) {
        onRatingUpdate(data.averageRating, data.totalReviews);
      }
    } catch (err) {
      setError(err.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (packageId || destinationId) {
      fetchReviews();
    }
  }, [packageId, destinationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if current user already has a review
  const userReview = reviews.find(
    (r) => user && r.user && (r.user._id === user._id || r.user === user._id)
  );

  const startEdit = (review) => {
    setEditingReviewId(review._id);
    setRating(review.rating);
    setTitle(review.title);
    setDescription(review.description);
    setFormError("");
    setSuccessMessage("");
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingReviewId(null);
    setRating(5);
    setTitle("");
    setDescription("");
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      openLogin();
      return;
    }

    if (!title.trim()) {
      setFormError("Please enter a review title");
      return;
    }
    if (!description.trim()) {
      setFormError("Please share your thoughts in the review description");
      return;
    }
    if (rating < 1 || rating > 5) {
      setFormError("Rating must be between 1 and 5 stars");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      if (editingReviewId) {
        await api.put(`/reviews/${editingReviewId}`, {
          rating,
          title: title.trim(),
          description: description.trim(),
        });
        setSuccessMessage("Your review has been updated!");
      } else {
        await api.post("/reviews", {
          packageId: packageId || undefined,
          destinationId: destinationId || undefined,
          rating,
          title: title.trim(),
          description: description.trim(),
        });
        setSuccessMessage("Thank you! Your review has been published.");
      }

      cancelForm();
      await fetchReviews();
    } catch (err) {
      setFormError(err.message || "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/reviews/${id}`);
      setSuccessMessage("Review deleted successfully.");
      await fetchReviews();
    } catch (err) {
      setError(err.message || "Could not delete review");
    } finally {
      setDeletingId(null);
    }
  };

  const ratingDescriptions = {
    1: "Poor experience",
    2: "Fair, but room for improvement",
    3: "Good experience",
    4: "Very good journey",
    5: "Exceptional & unforgettable",
  };

  return (
    <section className="reviews-section" id="reviews">
      <div className="reviews-container">
        <div className="reviews-header-block">
          <div>
            <p className="eyebrow">
              <span className="eyebrow-line" />
              Traveler Stories
            </p>
            <h2 className="reviews-title">Reviews & Ratings</h2>
            <p className="reviews-subtitle">
              Authentic feedback and reflections from guests who experienced {itemTitle}.
            </p>
          </div>

          <div className="reviews-action-btn">
            {!user ? (
              <Button onClick={openLogin} variant="outline" className="review-btn">
                <MessageSquare className="w-4 h-4 mr-2" /> Log in to write a review
              </Button>
            ) : userReview && !showForm ? (
              <Button onClick={() => startEdit(userReview)} variant="outline" className="review-btn">
                <Edit2 className="w-4 h-4 mr-2" /> Edit your review
              </Button>
            ) : !showForm ? (
              <Button onClick={() => setShowForm(true)} className="review-btn">
                <MessageSquare className="w-4 h-4 mr-2" /> Write a review
              </Button>
            ) : null}
          </div>
        </div>

        {/* Global Success / Notice */}
        {successMessage && (
          <div className="review-alert success" role="status">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage("")} className="alert-dismiss">
              ×
            </button>
          </div>
        )}

        {/* Overview Stats */}
        <div className="reviews-summary-grid">
          <div className="reviews-score-card">
            <div className="score-big">{Number(stats.averageRating).toFixed(1)}</div>
            <div className="score-stars">
              <StarRating value={stats.averageRating} size="lg" />
            </div>
            <p className="score-total">
              Based on <strong>{stats.totalReviews}</strong> {stats.totalReviews === 1 ? "review" : "reviews"}
            </p>
          </div>

          <div className="reviews-bars-card">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.ratingBreakdown[star] || 0;
              const pct = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
              return (
                <div key={star} className="rating-bar-row">
                  <span className="bar-label">
                    {star} <Star className="w-3 h-3 fill-current inline-block ml-0.5" />
                  </span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="bar-count">
                    {count} <small>({pct}%)</small>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submission / Edit Form */}
        {showForm && (
          <div className="review-form-card">
            <div className="form-card-header">
              <h3>{editingReviewId ? "Edit your review" : "Write your review"}</h3>
              <p>Your honest experience helps fellow travelers plan their own journeys.</p>
            </div>

            <form onSubmit={handleSubmit} className="review-form">
              <div className="form-group">
                <label className="form-label">Overall Rating</label>
                <div className="interactive-rating-picker">
                  <StarRating
                    value={rating}
                    onChange={(newVal) => setRating(newVal)}
                    interactive={true}
                    size="xl"
                  />
                  <span className="rating-descriptor">{ratingDescriptions[rating]}</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="review-title" className="form-label">
                  Review Headline
                </label>
                <Input
                  id="review-title"
                  placeholder="e.g. Unforgettable sunsets and seamless hospitality"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="review-description" className="form-label">
                  Your Review & Insights
                </label>
                <textarea
                  id="review-description"
                  className="review-textarea"
                  rows={4}
                  placeholder="Tell other travelers about your favorite moments, accommodations, guided tours, local recommendations..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                  required
                />
                <span className="character-count">{description.length}/2000 characters</span>
              </div>

              {formError && (
                <div className="review-alert error" role="alert">
                  <AlertCircle className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="form-actions">
                <Button type="button" variant="outline" onClick={cancelForm} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : editingReviewId ? "Save Changes" : "Post Review"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Reviews List */}
        <div className="reviews-list-wrap">
          {loading ? (
            <div className="reviews-loading">
              <div className="loading-spinner" />
              <p>Loading guest reviews...</p>
            </div>
          ) : error ? (
            <div className="reviews-error">
              <p>{error}</p>
              <Button variant="outline" onClick={fetchReviews}>
                Try again
              </Button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="reviews-empty">
              <MessageSquare className="w-10 h-10 empty-icon" />
              <h3>No reviews yet</h3>
              <p>Be the first traveler to review this experience!</p>
              {!user ? (
                <Button onClick={openLogin} className="mt-4">
                  Log in to leave the first review
                </Button>
              ) : (
                <Button onClick={() => setShowForm(true)} className="mt-4">
                  Write the first review
                </Button>
              )}
            </div>
          ) : (
            <div className="reviews-grid">
              {reviews.map((rev) => {
                const isAuthor =
                  user && rev.user && (rev.user._id === user._id || rev.user === user._id);
                const isAdmin = user && user.role === "admin";
                const reviewerName = rev.user?.name || "Verified Traveler";

                return (
                  <article key={rev._id} className="review-item-card">
                    <div className="review-item-header">
                      <div className="reviewer-avatar">
                        {reviewerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="reviewer-info">
                        <div className="reviewer-name-row">
                          <h4 className="reviewer-name">{reviewerName}</h4>
                          {isAuthor && <span className="author-badge">You</span>}
                        </div>
                        <p className="review-date">{formatDate(rev.createdAt)}</p>
                      </div>
                      <div className="review-item-stars">
                        <StarRating value={rev.rating} size="sm" />
                      </div>
                    </div>

                    <h5 className="review-item-title">{rev.title}</h5>
                    <p className="review-item-desc">{rev.description}</p>

                    {(isAuthor || isAdmin) && (
                      <div className="review-item-actions">
                        {isAuthor && (
                          <button
                            type="button"
                            onClick={() => startEdit(rev)}
                            className="review-action-btn edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(rev._id)}
                          disabled={deletingId === rev._id}
                          className="review-action-btn delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {deletingId === rev._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
