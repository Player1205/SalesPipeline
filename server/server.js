import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";

dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Middleware ───────────────────────────────────────────────────────────────

const allowedOrigins = [
  "http://localhost:5173", // Vite dev server
  "http://localhost:3000", // React fallback / browser tools
  process.env.CLIENT_URL,  // Production frontend URL (set in .env)
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin '${origin}' is not allowed.`));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);

// Health-check
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Nexus BDA Server",
    timestamp: new Date().toISOString(),
  });
});

// ─── Serve React frontend (production) ───────────────────────────────────────
// In production Render builds client/dist and Express serves it directly.
// In local dev this block is never hit — Vite runs on its own port.

const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));

// Any non-API request gets the React app (handles client-side routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

// ─── Global error handler ─────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error("[Global Error]", err.stack || err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Internal server error.",
  });
});

// ─── Database + Server bootstrap ─────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("FATAL: MONGO_URI is not defined in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully.");
    app.listen(PORT, () => {
      console.log(`🚀 Nexus server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
