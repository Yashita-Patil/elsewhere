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

  const item = await Package.findById(packageId);
  if (!item) return res.status(404).json({ message: "Package not found" });

  const booking = await Booking.create({
    bookingCode: `EL-${Date.now().toString().slice(-6)}`,
    user: req.user._id,
    package: item._id,
    title: item.title,
    location: item.location,
    travelDate: date,
    travelers: count,
    totalPrice: item.price * count, // calculated on the server so it can't be faked
  });
  res.status(201).json(booking);
}

// GET /api/bookings/mine  (the logged-in user's bookings, newest first)
export async function getMyBookings(req, res) {
  const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(bookings);
}

// PUT /api/bookings/:id/cancel
export async function cancelBooking(req, res) {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  booking.status = "Cancelled";
  await booking.save();
  res.json(booking);
}

// GET /api/bookings   (admin: every booking with the customer's details)
export async function getAllBookings(req, res) {
  const bookings = await Booking.find().populate("user", "name email").sort({ createdAt: -1 });
  res.json(bookings);
}
