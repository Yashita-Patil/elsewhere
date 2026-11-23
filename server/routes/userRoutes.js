import { Router } from "express";
import { getSavedPlaces, toggleSavedPlace } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.get("/saved", getSavedPlaces);
router.put("/saved/:destinationId", toggleSavedPlace);
export default router;
