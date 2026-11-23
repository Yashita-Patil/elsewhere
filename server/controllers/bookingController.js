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

// DELETE /api/bookings/:id (admin: remove a booking)
export async function deleteBooking(req, res) {
  const booking = await Booking.findByIdAndDelete(req.params.id);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  res.json({ message: "Booking deleted successfully", id: req.params.id });
}

// PATCH /api/bookings/:id/status (admin: update booking status)
export async function updateBookingStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || typeof status !== "string") {
    return res.status(400).json({ message: "Status is required" });
  }

  // Normalize case (e.g. "upcoming" -> "Upcoming")
  const normalized = status.trim().charAt(0).toUpperCase() + status.trim().slice(1).toLowerCase();
  const allowed = ["Upcoming", "Confirmed", "Completed", "Cancelled"];

  if (!allowed.includes(normalized)) {
    return res.status(400).json({
      message: `Invalid status '${status}'. Allowed statuses are: ${allowed.join(", ")}`,
    });
  }

  const booking = await Booking.findById(id).populate("user", "name email");
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  booking.status = normalized;
  await booking.save();

  res.json(booking);
}

// GET /api/bookings/stats (admin: analytics and statistics)
export async function getBookingStats(req, res) {
  try {
    // 1. Total bookings count
    const totalBookings = await Booking.countDocuments();

    // 2. Total revenue (excludes Cancelled bookings and unpaid/refunded bookings)
    const revenueResult = await Booking.aggregate([
      {
        $match: {
          status: { $ne: "Cancelled" },
          paymentStatus: { $nin: ["Unpaid", "Refunded"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
          activeBookingsCount: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const activeBookingsCount = revenueResult[0]?.activeBookingsCount || 0;
    const averageBookingValue =
      activeBookingsCount > 0 ? Math.round(totalRevenue / activeBookingsCount) : 0;

    // 3. Status breakdown counts
    const statusCountsRaw = await Booking.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusCounts = {
      Upcoming: 0,
      Confirmed: 0,
      Completed: 0,
      Cancelled: 0,
    };
    statusCountsRaw.forEach((item) => {
      if (item._id && statusCounts[item._id] !== undefined) {
        statusCounts[item._id] = item.count;
      }
    });

    // 4. Most booked journeys via aggregation pipeline
    const mostBookedJourneys = await Booking.aggregate([
      {
        $group: {
          _id: "$package",
          bookingCount: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$status", "Cancelled"] },
                    { $ne: ["$paymentStatus", "Unpaid"] },
                    { $ne: ["$paymentStatus", "Refunded"] },
                  ],
                },
                "$totalPrice",
                0,
              ],
            },
          },
          journeyTitle: { $first: "$title" },
          journeyLocation: { $first: "$location" },
        },
      },
      {
        $lookup: {
          from: "packages",
          localField: "_id",
          foreignField: "_id",
          as: "packageDetails",
        },
      },
      {
        $unwind: {
          path: "$packageDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          packageId: "$_id",
          name: { $ifNull: ["$packageDetails.title", "$journeyTitle"] },
          location: { $ifNull: ["$packageDetails.location", "$journeyLocation"] },
          image: "$packageDetails.image",
          price: "$packageDetails.price",
          bookingCount: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { bookingCount: -1, totalRevenue: -1 } },
      { $limit: 6 },
    ]);

    res.json({
      totalBookings,
      totalRevenue,
      averageBookingValue,
      statusCounts,
      mostBookedJourneys,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve booking analytics", error: error.message });
  }
}
