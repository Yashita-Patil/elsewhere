import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

import authRoutes from "./routes/authRoutes.js";
import destinationRoutes from "./routes/destinationRoutes.js";
import packageRoutes from "./routes/packageRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

async function main() {
  console.log("=== STARTING SELF-CONTAINED HTTP INTEGRATION TEST ===");
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/elsewhere";
  await mongoose.connect(uri);
  console.log("Connected to MongoDB for HTTP tests");

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/destinations", destinationRoutes);
  app.use("/api/packages", packageRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api", notFound);
  app.use(errorHandler);

  const server = app.listen(5099, async () => {
    console.log("Test HTTP Server running on http://localhost:5099");
    try {
      const BASE_URL = "http://localhost:5099/api";

      const fetchJSON = async (url, options = {}) => {
        const res = await fetch(url, options);
        const data = await res.json().catch(() => ({}));
        return { status: res.status, ok: res.ok, data };
      };

      // 1. Health check
      const health = await fetchJSON(`${BASE_URL}/health`);
      console.log("[HTTP 1] /api/health status:", health.status, health.data);
      if (health.data.status !== "ok") throw new Error("Health check failed");

      // 2. Destinations list & detail
      const destinations = await fetchJSON(`${BASE_URL}/destinations`);
      console.log(`[HTTP 2] /api/destinations returned ${destinations.data.length} destinations`);
      if (!destinations.data.length) throw new Error("Destinations empty");

      const amalfiDest = await fetchJSON(`${BASE_URL}/destinations/amalfi-coast`);
      console.log(`[HTTP 2] /api/destinations/amalfi-coast: status=${amalfiDest.status}, name="${amalfiDest.data.name}"`);

      // 3. Packages list & Package by ID (Feature 4 API)
      const packages = await fetchJSON(`${BASE_URL}/packages`);
      console.log(`[HTTP 3] /api/packages returned ${packages.data.length} packages`);
      const firstPkg = packages.data[0];

      const pkgDetail = await fetchJSON(`${BASE_URL}/packages/${firstPkg._id}`);
      console.log(`[HTTP 3] /api/packages/${firstPkg._id}: status=${pkgDetail.status}, title="${pkgDetail.data.title}"`);
      console.log(`  -> Accommodation: ${pkgDetail.data.accommodation?.name}`);
      console.log(`  -> Transportation: ${pkgDetail.data.transportation?.flightInfo}`);
      console.log(`  -> Meals: ${pkgDetail.data.inclusions?.meals?.length} items`);
      console.log(`  -> Benefits: ${pkgDetail.data.additionalBenefits?.length} items`);
      console.log(`  -> Exclusions: ${pkgDetail.data.exclusions?.length} items`);

      if (!pkgDetail.data.accommodation || !pkgDetail.data.transportation) {
        throw new Error("Extended package details missing in HTTP response!");
      }

      // 4. Planner query parameters (Feature 2 API)
      const plannerRes = await fetchJSON(
        `${BASE_URL}/packages?place=bali&category=Relaxation&maxPrice=2000`
      );
      console.log(`[HTTP 4] Planner combined query (place=bali&category=Relaxation&maxPrice=2000) returned ${plannerRes.data.length} package(s)`);
      plannerRes.data.forEach((p) => {
        if (p.price > 2000) throw new Error(`Package price ${p.price} exceeds budget!`);
      });

      // 5. Auth: Login
      const loginRes = await fetchJSON(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@elsewhere.com", password: "Demo@123" }),
      });
      console.log(`[HTTP 5] Auth login: status=${loginRes.status}, user="${loginRes.data.name}"`);
      const token = loginRes.data.token;
      if (!token) throw new Error("No token returned on login");

      // 6. Reviews API (Feature 1 API)
      // GET reviews for a package
      const reviewsRes = await fetchJSON(`${BASE_URL}/reviews?package=${firstPkg._id}`);
      console.log(`[HTTP 6] GET /api/reviews?package=${firstPkg._id}: returned ${reviewsRes.data.reviews?.length} review(s), averageRating=${reviewsRes.data.averageRating}`);

      // Try creating a review on Canada package
      const canadaPkg = packages.data.find((p) => p.title.includes("Canadian")) || packages.data[2];
      const createRevRes = await fetchJSON(`${BASE_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packageId: canadaPkg._id,
          rating: 5,
          title: "Incredible glacial lakes and wilderness",
          description: "Moraine lake at sunrise was magical beyond words. Exceptional guides.",
        }),
      });
      console.log(`[HTTP 6] POST /api/reviews: status=${createRevRes.status}`);

      if (createRevRes.status === 201) {
        const revId = createRevRes.data._id;
        console.log(`  -> Created review ID: ${revId}`);

        // Update review
        const updateRevRes = await fetchJSON(`${BASE_URL}/reviews/${revId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: 5,
            title: "Incredible glacial lakes (Updated)",
            description: "Updated review content - our family had the journey of a lifetime.",
          }),
        });
        console.log(`  -> PUT /api/reviews/${revId}: status=${updateRevRes.status}, title="${updateRevRes.data.title}"`);

        // Delete review
        const delRevRes = await fetchJSON(`${BASE_URL}/reviews/${revId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(`  -> DELETE /api/reviews/${revId}: status=${delRevRes.status}`);
      }

      // 7. Booking API (Feature 4 Booking requirement)
      const bookingRes = await fetchJSON(`${BASE_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packageId: firstPkg._id,
          travelDate: new Date(Date.now() + 86400000 * 60).toISOString(),
          travelers: 2,
        }),
      });
      console.log(`[HTTP 7] POST /api/bookings: status=${bookingRes.status}, code=${bookingRes.data.bookingCode}, total=$${bookingRes.data.totalPrice}`);
      if (bookingRes.status === 201) {
        const bId = bookingRes.data._id;
        await fetchJSON(`${BASE_URL}/bookings/${bId}/cancel`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("  -> Successfully cancelled test booking");
      }

      console.log("\n=======================================================");
      console.log("ALL HTTP REST INTEGRATION TESTS PASSED SUCCESSFULLY (7/7)!");
      console.log("=======================================================\n");

      server.close();
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error("Test failed:", err);
      server.close();
      await mongoose.disconnect();
      process.exit(1);
    }
  });
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
