import { Router } from "express";
import {
  getDestinations, getDestination, getDestinationPackages,
  createDestination, updateDestination, deleteDestination,
} from "../controllers/destinationController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();
router.get("/", getDestinations);
router.get("/:slug", getDestination);
router.get("/:slug/packages", getDestinationPackages);

// admin only
router.post("/", protect, adminOnly, createDestination);
router.put("/:id", protect, adminOnly, updateDestination);
router.delete("/:id", protect, adminOnly, deleteDestination);
export default router;
