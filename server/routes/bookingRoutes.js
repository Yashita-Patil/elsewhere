
import { Router } from "express";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
  addBookingReview,
  getAllBookings,
  updateBookingStatus,
  getBookingStats,
  deleteBooking,
} from "../controllers/bookingController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();

router.use(protect);

// Client booking routes
router.post("/", createBooking);
router.get("/mine", getMyBookings);
router.put("/:id/cancel", cancelBooking);
router.post("/:id/review", addBookingReview);

// Admin booking routes
router.get("/stats", adminOnly, getBookingStats);
router.get("/", adminOnly, getAllBookings);
router.patch("/:id/status", adminOnly, updateBookingStatus);
router.delete("/:id", adminOnly, deleteBooking);

export default router;
