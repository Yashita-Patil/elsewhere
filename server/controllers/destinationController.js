import Destination from "../models/Destination.js";
import Package from "../models/Package.js";

// GET /api/destinations  (oldest first, so the cards keep the same order)
export async function getDestinations(req, res) {
  const destinations = await Destination.find().sort({ createdAt: 1, _id: 1 });
  res.json(destinations);
}

// GET /api/destinations/:slug
export async function getDestination(req, res) {
  const destination = await Destination.findOne({ slug: req.params.slug });
  if (!destination) return res.status(404).json({ message: "Destination not found" });
  res.json(destination);
}

// GET /api/destinations/:slug/packages  (journeys that belong to one destination)
export async function getDestinationPackages(req, res) {
  const destination = await Destination.findOne({ slug: req.params.slug });
  if (!destination) return res.status(404).json({ message: "Destination not found" });
  const packages = await Package.find({ destination: destination._id }).sort({ createdAt: 1, _id: 1 });
  res.json(packages);
}

// ----- Admin only -----

// POST /api/destinations
export async function createDestination(req, res) {
  const destination = await Destination.create(req.body);
  res.status(201).json(destination);
}

// PUT /api/destinations/:id
export async function updateDestination(req, res) {
  const destination = await Destination.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!destination) return res.status(404).json({ message: "Destination not found" });
  res.json(destination);
}

// DELETE /api/destinations/:id
export async function deleteDestination(req, res) {
  const inUse = await Package.exists({ destination: req.params.id });
  if (inUse) {
    return res.status(400).json({ message: "Delete this destination's packages first" });
  }
  const destination = await Destination.findByIdAndDelete(req.params.id);
  if (!destination) return res.status(404).json({ message: "Destination not found" });
  res.json({ message: "Destination deleted" });
}
