import User from "../models/User.js";
import Destination from "../models/Destination.js";

// GET /api/users/saved  (full destination details, used by the "My trips" dashboard)
export async function getSavedPlaces(req, res) {
  const user = await User.findById(req.user._id).populate("savedPlaces");
  res.json(user.savedPlaces);
}

// PUT /api/users/saved/:destinationId  (adds the place, or removes it if already saved)
export async function toggleSavedPlace(req, res) {
  const destination = await Destination.findById(req.params.destinationId);
  if (!destination) return res.status(404).json({ message: "Destination not found" });

  const user = req.user;
  const alreadySaved = user.savedPlaces.some((id) => id.equals(destination._id));
  if (alreadySaved) user.savedPlaces.pull(destination._id);
  else user.savedPlaces.push(destination._id);
  await user.save();

  res.json({ savedPlaces: user.savedPlaces.map(String) });
}
