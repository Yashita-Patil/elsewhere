import "dotenv/config"; // loads the variables from .env
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import destinationRoutes from "./routes/destinationRoutes.js";
import packageRoutes from "./routes/packageRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ----- Middleware -----
app.use(helmet({ contentSecurityPolicy: false })); // safer HTTP headers
app.use(cors()); // lets the React dev server call this API
app.use(express.json()); // reads JSON request bodies
app.use(morgan("dev")); // prints every request in the terminal

// ----- API routes -----
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);
app.use("/api", notFound); // any other /api/... URL

// ----- Production: serve the built React app from this same server -----
if (process.env.NODE_ENV === "production") {
  const clientBuild = path.join(__dirname, "../client/dist");
  app.use(express.static(clientBuild));
  app.use((req, res) => res.sendFile(path.join(clientBuild, "index.html"))); // React Router handles the URL
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
