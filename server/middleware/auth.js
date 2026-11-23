import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Allows a request only if it carries a valid "Authorization: Bearer <token>" header
export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Please log in to continue" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "This account no longer exists" });

    req.user = user; // available in the next handlers
    next();
  } catch {
    res.status(401).json({ message: "Your session has expired. Please log in again" });
  }
}

// Use after protect() to allow only admins
export function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Admin access only" });
  next();
}
