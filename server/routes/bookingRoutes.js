import { Router } from "express";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
  getAllBookings,
  updateBookingStatus,
  getBookingStats,
  deleteBooking,
} from "../controllers/bookingController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();
router.use(protect); // every booking route needs a logged-in user

router.post("/", createBooking);
router.get("/mine", getMyBookings);
router.put("/:id/cancel", cancelBooking);

// Admin routes
router.get("/stats", adminOnly, getBookingStats);
router.get("/", adminOnly, getAllBookings);
router.patch("/:id/status", adminOnly, updateBookingStatus);
router.put("/:id/status", adminOnly, updateBookingStatus);
router.delete("/:id", adminOnly, deleteBooking);

export default router;
