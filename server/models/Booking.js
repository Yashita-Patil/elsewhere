import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: { type: String, required: true, unique: true }, // e.g. EL-482913
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    package: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true },
    // A copy of the package details, so the booking history stays correct even if the package is edited later
    title: { type: String, required: true },
    location: { type: String, required: true },
    travelDate: { type: Date, required: true },
    travelers: { type: Number, required: true, min: 1, max: 6 },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Upcoming", "Confirmed", "Completed", "Cancelled"],
      default: "Upcoming",
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Unpaid", "Refunded"],
      default: "Paid",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Booking", bookingSchema);
