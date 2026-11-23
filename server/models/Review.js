import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination",
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    title: {
      type: String,
      required: [true, "Review title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Review description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
  },
  { timestamps: true }
);

// Prevent duplicate reviews from the same user for the same package
reviewSchema.index(
  { user: 1, package: 1 },
  { unique: true, partialFilterExpression: { package: { $exists: true, $ne: null } } }
);

// Prevent duplicate reviews from the same user for the same destination
reviewSchema.index(
  { user: 1, destination: 1 },
  { unique: true, partialFilterExpression: { destination: { $exists: true, $ne: null } } }
);

// Pre-save validation hook for duplicate reviews
reviewSchema.pre("save", async function () {
  if (this.isNew) {
    if (this.package) {
      const existing = await mongoose.models.Review.findOne({
        user: this.user,
        package: this.package,
      });
      if (existing) {
        const error = new Error("You have already reviewed this package.");
        error.code = 11000;
        throw error;
      }
    } else if (this.destination) {
      const existing = await mongoose.models.Review.findOne({
        user: this.user,
        destination: this.destination,
      });
      if (existing) {
        const error = new Error("You have already reviewed this destination.");
        error.code = 11000;
        throw error;
      }
    }
  }
});

export default mongoose.model("Review", reviewSchema);
