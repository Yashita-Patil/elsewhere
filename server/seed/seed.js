// Run with:  npm run seed
// WARNING: this DELETES everything in the database and loads fresh sample data.
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Destination from "../models/Destination.js";
import Package from "../models/Package.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import { destinations, packages, sampleReviews } from "./data.js";

async function seed() {
  await connectDB();

  // 1. Clear old data
  await Promise.all([
    User.deleteMany(),
    Destination.deleteMany(),
    Package.deleteMany(),
    Booking.deleteMany(),
    Review.deleteMany(),
  ]);

  // 2. Destinations
  const savedDestinations = await Destination.insertMany(destinations);
  const idBySlug = Object.fromEntries(savedDestinations.map((d) => [d.slug, d._id]));

  // 3. Packages (each one points to its destination)
  const savedPackages = await Package.insertMany(
    packages.map(({ destinationSlug, ...rest }) => ({
      ...rest,
      destination: idBySlug[destinationSlug],
    }))
  );
  const pkgByTitle = Object.fromEntries(savedPackages.map((p) => [p.title, p]));

  // 4. Users: one admin and one normal demo user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@elsewhere.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  const adminUser = await User.create({
    name: "Admin",
    email: adminEmail,
    password: adminPassword,
    role: "admin",
  });
  const demoUser = await User.create({
    name: "Demo Traveler",
    email: "demo@elsewhere.com",
    password: "Demo@123",
  });

  const userByName = {
    Admin: adminUser._id,
    "Demo Traveler": demoUser._id,
  };

  // 5. Seed Reviews
  if (sampleReviews && sampleReviews.length) {
    for (const rev of sampleReviews) {
      const targetPkg = pkgByTitle[rev.packageTitle];
      const userId = userByName[rev.reviewerName] || demoUser._id;
      if (targetPkg) {
        await Review.create({
          user: userId,
          package: targetPkg._id,
          destination: targetPkg.destination,
          rating: rev.rating,
          title: rev.title,
          description: rev.description,
        });
      }
    }

    // Recalculate and sync stats for each package & destination
    for (const pkg of savedPackages) {
      const pkgReviews = await Review.find({ package: pkg._id });
      const count = pkgReviews.length;
      const avg = count > 0 ? pkgReviews.reduce((sum, r) => sum + r.rating, 0) / count : pkg.rating;
      await Package.findByIdAndUpdate(pkg._id, {
        rating: Math.round(avg * 100) / 100,
        numReviews: count,
      });
    }

    for (const dest of savedDestinations) {
      const destPkgs = await Package.find({ destination: dest._id });
      const destPkgIds = destPkgs.map((p) => p._id);
      const destReviews = await Review.find({
        $or: [{ destination: dest._id }, { package: { $in: destPkgIds } }],
      });
      const count = destReviews.length;
      const avg = count > 0 ? destReviews.reduce((sum, r) => sum + r.rating, 0) / count : dest.rating;
      await Destination.findByIdAndUpdate(dest._id, {
        rating: Math.round(avg * 100) / 100,
        numReviews: count,
      });
    }
  }

  const reviewCount = await Review.countDocuments();
  console.log(`Seeded ${savedDestinations.length} destinations, ${savedPackages.length} packages, ${reviewCount} reviews, and 2 users`);
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log("Demo login:  demo@elsewhere.com / Demo@123");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
