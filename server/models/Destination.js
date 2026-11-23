import mongoose from "mongoose";

const destinationSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true }, // used in the URL
    name: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    tagline: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    image: { type: String, required: true }, // e.g. /images/bali-coast.jpg
    days: { type: Number, required: true, min: 1 },
    from: { type: Number, required: true, min: 0 }, // starting price per person (USD)
    highlights: [{ type: String }],
    category: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export default mongoose.model("Destination", destinationSchema);
