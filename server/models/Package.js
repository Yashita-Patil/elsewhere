import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true }, // text shown on the card, e.g. "Bali, Indonesia"
    destination: { type: mongoose.Schema.Types.ObjectId, ref: "Destination", required: true },
    duration: { type: Number, required: true, min: 1 }, // days
    price: { type: Number, required: true, min: 0 }, // per person (USD)
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    category: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("Package", packageSchema);
