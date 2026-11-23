import { Router } from "express";
import {
  getProfile,
  updateProfile,
  updatePassword,
  deleteAccount,
  getSavedPlaces,
  toggleSavedPlace,
  removeSavedPlace,
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/password", updatePassword);
router.delete("/account", deleteAccount);

router.get("/saved", getSavedPlaces);
router.put("/saved/:destinationId", toggleSavedPlace);
router.delete("/saved/:destinationId", removeSavedPlace);

export default router;
