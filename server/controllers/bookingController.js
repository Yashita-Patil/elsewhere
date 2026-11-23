import Booking from "../models/Booking.js";
import Package from "../models/Package.js";

// POST /api/bookings   body: { packageId, travelDate, travelers }
export async function createBooking(req, res) {
  const { packageId, travelDate, travelers } = req.body;
  const count = Number(travelers);

  if (!packageId || !travelDate) {
    return res.status(400).json({ message: "Package and travel date are required" });
  }
  if (!Number.isInteger(count) || count < 1 || count > 6) {
    return res.status(400).json({ message: "Travelers must be between 1 and 6" });
  }
  const date = new Date(travelDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (Number.isNaN(date.getTime()) || date < today) {
    return res.status(400).json({ message: "Please choose a date in the future" });
  }

  const item = await Package.findById(packageId).populate("destination");
  if (!item) return res.status(404).json({ message: "Package not found" });

  const highlights = item.destination?.highlights || [
    "Private arrival welcome & transfer",
    "Curated neighborhood walking experience",
    "Farewell dinner with scenic views",
  ];

  const booking = await Booking.create({
    bookingCode: `EL-${Date.now().toString().slice(-6)}`,
    user: req.user._id,
    package: item._id,
    title: item.title,
    location: item.location,
    travelDate: date,
    travelers: count,
    totalPrice: item.price * count, // calculated on the server so it can't be faked
    status: "Upcoming",
    hotel: "4-star Boutique Hotel & Heritage Stay",
    transport: "Private chauffeured transfers & local scenic transfers",
    meals: "Daily artisan breakfast & welcome traditional dinner",
    activities: highlights,
    inclusions: [
      "Accommodations with daily breakfast",
      "All ground transportation & airport transfers",
      "Dedicated local host & private excursions",
      "Taxes and 24/7 on-trip concierge assistance",
    ],
  });
  res.status(201).json(booking);
}

// GET /api/bookings/mine  (the logged-in user's bookings, newest first)
export async function getMyBookings(req, res) {
  const bookings = await Booking.find({ user: req.user._id })
    .populate("package", "title location image duration price rating description highlights")
    .sort({ createdAt: -1 });

  // Dynamically update status if travel date has passed and not cancelled
  const now = new Date();
  for (const b of bookings) {
    if (b.status === "Upcoming" && new Date(b.travelDate) < now) {
      b.status = "Completed";
      await b.save();
    }
  }

  res.json(bookings);
}

// PUT /api/bookings/:id/cancel
export async function cancelBooking(req, res) {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  if (booking.status === "Completed") {
    return res.status(400).json({ message: "Completed journeys cannot be cancelled" });
  }
  booking.status = "Cancelled";
  await booking.save();
  res.json(booking);
}

// POST /api/bookings/:id/review
export async function addBookingReview(req, res) {
  const { rating, comment } = req.body;
  const numRating = Number(rating);

  if (!numRating || numRating < 1 || numRating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5 stars" });
  }
  if (!comment?.trim()) {
    return res.status(400).json({ message: "Please provide a review comment" });
  }

  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  booking.review = {
    rating: numRating,
    comment: comment.trim(),
    createdAt: new Date(),
  };

  await booking.save();
  res.json({ message: "Thank you! Your review has been saved.", review: booking.review });
}

// GET /api/bookings   (admin: every booking with the customer's details)
export async function getAllBookings(req, res) {
  const bookings = await Booking.find().populate("user", "name email").sort({ createdAt: -1 });
  res.json(bookings);
}
