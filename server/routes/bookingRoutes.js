import { Router } from "express";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
  addBookingReview,
  getAllBookings,
} from "../controllers/bookingController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();
router.use(protect); // every booking route needs a logged-in user

router.post("/", createBooking);
router.get("/mine", getMyBookings);
router.put("/:id/cancel", cancelBooking);
router.post("/:id/review", addBookingReview);
router.get("/", adminOnly, getAllBookings);

export default router;
