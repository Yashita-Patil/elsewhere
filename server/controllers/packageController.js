import Package from "../models/Package.js";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sortOptions = {
  popular: { rating: -1 },
  "price-low": { price: 1 },
  "price-high": { price: -1 },
  shortest: { duration: 1 },
};

// GET /api/packages?category=Coast&maxPrice=2500&maxDays=7&search=bali&place=italy&sort=price-low
export async function getPackages(req, res) {
  const { category, maxPrice, maxDays, search, place, sort } = req.query;
  const filter = {};

  if (category && category !== "All journeys") filter.category = category;
  if (maxPrice) filter.price = { $lte: Number(maxPrice) };
  if (maxDays) filter.duration = { $lte: Number(maxDays) };

  // "search" = the journeys search box, "place" = the destination search at the top of the page.
  // Both must match when both are used.
  const conditions = [];
  if (search?.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), "i"); // case-insensitive "contains"
    conditions.push({ $or: [{ title: regex }, { location: regex }, { category: regex }] });
  }
  if (place?.trim()) {
    const regex = new RegExp(escapeRegex(place.trim()), "i");
    conditions.push({ $or: [{ title: regex }, { location: regex }] });
  }
  if (conditions.length) filter.$and = conditions;

  // no sort chosen = the order they were created in
  const packages = await Package.find(filter).sort(sortOptions[sort] || { createdAt: 1, _id: 1 });
  res.json(packages);
}

// ----- Admin only -----

// POST /api/packages
export async function createPackage(req, res) {
  const item = await Package.create(req.body);
  res.status(201).json(item);
}

// PUT /api/packages/:id
export async function updatePackage(req, res) {
  const item = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: "Package not found" });
  res.json(item);
}

// DELETE /api/packages/:id
export async function deletePackage(req, res) {
  const item = await Package.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Package not found" });
  res.json({ message: "Package deleted" });
}
