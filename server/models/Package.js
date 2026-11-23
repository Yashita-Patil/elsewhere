import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true }, // text shown on the card, e.g. "Bali, Indonesia"
    destination: { type: mongoose.Schema.Types.ObjectId, ref: "Destination", required: true },
    duration: { type: Number, required: true, min: 1 }, // days
    nights: { type: Number, min: 0 },
    price: { type: Number, required: true, min: 0 }, // per person (USD)
    rating: { type: Number, default: 5, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
    category: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    gallery: [{ type: String }],
    description: { type: String, required: true },
    detailedDescription: { type: String },
    accommodation: {
      name: { type: String },
      image: { type: String },
      location: { type: String },
      nights: { type: Number },
      roomType: { type: String },
      amenities: [{ type: String }],
      mealPlan: { type: String },
    },
    transportation: {
      flightInfo: { type: String },
      departureArrival: { type: String },
      airportTransfer: { type: Boolean, default: false },
      transferType: { type: String },
      localTransport: { type: String },
      otherServices: [{ type: String }],
    },
    inclusions: {
      meals: [{ type: String }],
      sightseeing: [{ type: String }],
      entryTickets: [{ type: String }],
      guidedTours: [{ type: String }],
      adventureActivities: [{ type: String }],
      culturalExperiences: [{ type: String }],
      otherExperiences: [{ type: String }],
    },
    additionalBenefits: [{ type: String }],
    exclusions: [{ type: String }],
  },
  { timestamps: true },
);

export default mongoose.model("Package", packageSchema);
