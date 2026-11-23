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

  const sophiaUser = await User.create({
    name: "Sophia Laurent",
    email: "sophia@example.com",
    password: "Demo@123",
  });

  const liamUser = await User.create({
    name: "Liam Chen",
    email: "liam@example.com",
    password: "Demo@123",
  });

  // 5. Seed Reviews
  const userByName = {
    Admin: adminUser._id,
    "Demo Traveler": demoUser._id,
  };

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

    // Recalculate package ratings
    for (const pkg of savedPackages) {
      const pkgReviews = await Review.find({ package: pkg._id });
      const count = pkgReviews.length;

      const avg =
        count > 0
          ? pkgReviews.reduce((sum, r) => sum + r.rating, 0) / count
          : pkg.rating;

      await Package.findByIdAndUpdate(pkg._id, {
        rating: Math.round(avg * 100) / 100,
        numReviews: count,
      });
    }

    // Recalculate destination ratings
    for (const dest of savedDestinations) {
      const destPkgs = await Package.find({ destination: dest._id });
      const destPkgIds = destPkgs.map((p) => p._id);

      const destReviews = await Review.find({
        $or: [
          { destination: dest._id },
          { package: { $in: destPkgIds } },
        ],
      });

      const count = destReviews.length;

      const avg =
        count > 0
          ? destReviews.reduce((sum, r) => sum + r.rating, 0) / count
          : dest.rating;

      await Destination.findByIdAndUpdate(dest._id, {
        rating: Math.round(avg * 100) / 100,
        numReviews: count,
      });
    }
  }

  // 6. Seed Sample Bookings
  if (savedPackages.length >= 4) {
    const sampleBookings = [
      {
        bookingCode: "EL-841920",
        user: demoUser._id,
        package: savedPackages[0]._id,
        title: savedPackages[0].title,
        location: savedPackages[0].location,
        travelDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        travelers: 2,
        totalPrice: savedPackages[0].price * 2,
        status: "Upcoming",
        paymentStatus: "Paid",
      },
      {
        bookingCode: "EL-521943",
        user: sophiaUser._id,
        package: savedPackages[0]._id,
        title: savedPackages[0].title,
        location: savedPackages[0].location,
        travelDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
        travelers: 3,
        totalPrice: savedPackages[0].price * 3,
        status: "Confirmed",
        paymentStatus: "Paid",
      },
      {
        bookingCode: "EL-391048",
        user: demoUser._id,
        package: savedPackages[1]._id,
        title: savedPackages[1].title,
        location: savedPackages[1].location,
        travelDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
        travelers: 2,
        totalPrice: savedPackages[1].price * 2,
        status: "Confirmed",
        paymentStatus: "Paid",
      },
      {
        bookingCode: "EL-194820",
        user: liamUser._id,
        package: savedPackages[2]._id,
        title: savedPackages[2].title,
        location: savedPackages[2].location,
        travelDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
        travelers: 1,
        totalPrice: savedPackages[2].price,
        status: "Completed",
        paymentStatus: "Paid",
      },
      {
        bookingCode: "EL-948123",
        user: sophiaUser._id,
        package: savedPackages[1]._id,
        title: savedPackages[1].title,
        location: savedPackages[1].location,
        travelDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        travelers: 2,
        totalPrice: savedPackages[1].price * 2,
        status: "Completed",
        paymentStatus: "Paid",
      },
      {
        bookingCode: "EL-610294",
        user: demoUser._id,
        package: savedPackages[3]._id,
        title: savedPackages[3].title,
        location: savedPackages[3].location,
        travelDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
        travelers: 2,
        totalPrice: savedPackages[3].price * 2,
        status: "Cancelled",
        paymentStatus: "Refunded",
      },
    ];

    await Booking.insertMany(sampleBookings);
    console.log(`Seeded ${sampleBookings.length} bookings`);
  }

  const reviewCount = await Review.countDocuments();

  console.log(
    `Seeded ${savedDestinations.length} destinations, ${savedPackages.length} packages, ${reviewCount} reviews, and 4 users`
  );
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log("Demo login:  demo@elsewhere.com / Demo@123");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
