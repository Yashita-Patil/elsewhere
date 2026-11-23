import Review from "../models/Review.js";
import Package from "../models/Package.js";
import Destination from "../models/Destination.js";

// Helper to recalculate and store average ratings and review count
async function updateRatingStats(packageId, destinationId) {
  if (packageId) {
    const reviews = await Review.find({ package: packageId });
    const count = reviews.length;
    const avg = count > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / count : 5.0;
    const roundedAvg = Math.round(avg * 100) / 100;

    const updatedPkg = await Package.findByIdAndUpdate(
      packageId,
      { rating: roundedAvg, numReviews: count },
      { new: true }
    );

    const destId = destinationId || updatedPkg?.destination;
    if (destId) {
      await updateDestinationStats(destId);
    }
  } else if (destinationId) {
    await updateDestinationStats(destinationId);
  }
}

async function updateDestinationStats(destId) {
  const destPackages = await Package.find({ destination: destId });
  const pkgIds = destPackages.map((p) => p._id);
  const reviews = await Review.find({
    $or: [{ destination: destId }, { package: { $in: pkgIds } }],
  });
  const count = reviews.length;
  const avg = count > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / count : 5.0;
  const roundedAvg = Math.round(avg * 100) / 100;

  await Destination.findByIdAndUpdate(destId, {
    rating: roundedAvg,
    numReviews: count,
  });
}

// GET /api/reviews?package=:packageId&destination=:destinationId
export async function getReviews(req, res) {
  const { package: packageId, destination: destinationId } = req.query;

  const query = {};
  if (packageId) {
    query.package = packageId;
  } else if (destinationId) {
    // If querying by destination, include reviews explicitly for destination or its packages
    const destPackages = await Package.find({ destination: destinationId });
    const pkgIds = destPackages.map((p) => p._id);
    query.$or = [{ destination: destinationId }, { package: { $in: pkgIds } }];
  }

  const reviews = await Review.find(query)
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews) * 100) / 100
      : 5.0;

  const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const star = Math.round(r.rating);
    if (ratingBreakdown[star] !== undefined) {
      ratingBreakdown[star]++;
    }
  }

  res.json({
    reviews,
    averageRating,
    totalReviews,
    ratingBreakdown,
  });
}

// POST /api/reviews
// Body: { packageId, destinationId, rating, title, description }
export async function createReview(req, res) {
  const { packageId, destinationId, rating, title, description } = req.body;
  const numRating = Number(rating);

  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ message: "Review title and description are required" });
  }

  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
  }

  if (!packageId && !destinationId) {
    return res.status(400).json({ message: "Package ID or Destination ID is required" });
  }

  let destId = destinationId;
  if (packageId) {
    const pkg = await Package.findById(packageId);
    if (!pkg) return res.status(404).json({ message: "Package not found" });
    if (!destId) destId = pkg.destination;

    // Check duplicate
    const existing = await Review.findOne({ user: req.user._id, package: packageId });
    if (existing) {
      return res.status(400).json({
        message: "You have already reviewed this package. You can update your existing review.",
        existingReviewId: existing._id,
      });
    }
  } else if (destId) {
    const existing = await Review.findOne({ user: req.user._id, destination: destId });
    if (existing) {
      return res.status(400).json({
        message: "You have already reviewed this destination. You can update your existing review.",
        existingReviewId: existing._id,
      });
    }
  }

  const review = await Review.create({
    user: req.user._id,
    package: packageId || undefined,
    destination: destId || undefined,
    rating: numRating,
    title: title.trim(),
    description: description.trim(),
  });

  await updateRatingStats(packageId, destId);

  const populatedReview = await Review.findById(review._id).populate("user", "name email");
  res.status(201).json(populatedReview);
}

// PUT /api/reviews/:id
export async function updateReview(req, res) {
  const { rating, title, description } = req.body;
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  // Authorization check
  const isOwner = review.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "You are not authorized to edit this review" });
  }

  if (rating !== undefined) {
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
    }
    review.rating = numRating;
  }

  if (title !== undefined) {
    if (!title.trim()) return res.status(400).json({ message: "Title cannot be empty" });
    review.title = title.trim();
  }

  if (description !== undefined) {
    if (!description.trim()) return res.status(400).json({ message: "Description cannot be empty" });
    review.description = description.trim();
  }

  await review.save();
  await updateRatingStats(review.package, review.destination);

  const populatedReview = await Review.findById(review._id).populate("user", "name email");
  res.json(populatedReview);
}

// DELETE /api/reviews/:id
export async function deleteReview(req, res) {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  // Authorization check
  const isOwner = review.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "You are not authorized to delete this review" });
  }

  const packageId = review.package;
  const destinationId = review.destination;

  await Review.findByIdAndDelete(req.params.id);
  await updateRatingStats(packageId, destinationId);

  res.json({ message: "Review deleted successfully" });
}
