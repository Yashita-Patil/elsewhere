// Run with:  npm run seed
// WARNING: this DELETES everything in the database and loads fresh sample data.
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Destination from "../models/Destination.js";
import Package from "../models/Package.js";
import Booking from "../models/Booking.js";
import { destinations, packages } from "./data.js";

async function seed() {
  await connectDB();

  // 1. Clear old data
  await Promise.all([User.deleteMany(), Destination.deleteMany(), Package.deleteMany(), Booking.deleteMany()]);

  // 2. Destinations
  const savedDestinations = await Destination.insertMany(destinations);
  const idBySlug = Object.fromEntries(savedDestinations.map((d) => [d.slug, d._id]));

  // 3. Packages (each one points to its destination)
  await Package.insertMany(
    packages.map(({ destinationSlug, ...rest }) => ({ ...rest, destination: idBySlug[destinationSlug] })),
  );

  // 4. Users: one admin and one normal demo user (passwords are hashed automatically)
  const adminEmail = process.env.ADMIN_EMAIL || "admin@elsewhere.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  await User.create({ name: "Admin", email: adminEmail, password: adminPassword, role: "admin" });
  await User.create({ name: "Demo Traveler", email: "demo@elsewhere.com", password: "Demo@123" });

  console.log(`Seeded ${savedDestinations.length} destinations, ${packages.length} packages and 2 users`);
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log("Demo login:  demo@elsewhere.com / Demo@123");
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
