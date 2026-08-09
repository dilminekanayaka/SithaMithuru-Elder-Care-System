import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import pool, { connectDB } from "./config/db";
import { initSocketHandler } from "./sockets/socketHandler";
import "./config/firebase";
import { errorHandler } from "./middlewares/errorHandler";
import { initCronJobs } from "./utils/cron";
import { setIo } from "./utils/ioProvider";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import medicationRoutes from "./routes/medicationRoutes";
import taskRoutes from "./routes/taskRoutes";
import moodRoutes from "./routes/moodRoutes";
import journalRoutes from "./routes/journalRoutes";
import guardianRoutes from "./routes/guardianRoutes";
import emergencyRoutes from "./routes/emergencyRoutes";
import connectionRoutes from "./routes/connectionRoutes";
import syncRoutes from "./routes/syncRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import aiRoutes from "./routes/aiRoutes";
import { apiLimiter, authLimiter } from "./middlewares/rateLimiter";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────
const corsOrigin = process.env.CORS_ORIGIN || "*";
const isProduction = process.env.NODE_ENV === "production";

// SECURITY: HTTP → HTTPS redirect in production
if (isProduction) {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// SECURITY: Helmet with HSTS for HTTPS enforcement
app.use(
  helmet({
    hsts: {
      maxAge: 31536000,       // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
  })
);
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(morgan(isProduction ? "combined" : "dev"));

// Apply global rate limiting to all API requests
app.use("/api/v1/", apiLimiter);

// ─── Public Routes ───────────────────────────────────────────
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/users", userRoutes);

// ─── Protected Elder Routes ───────────────────────────────────────────────────
app.use("/api/v1/medications", medicationRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/mood", moodRoutes);
app.use("/api/v1/journal", journalRoutes);

// ─── Protected Guardian Routes ────────────────────────────────────────────────
app.use("/api/v1/guardian", guardianRoutes);

// ─── Protected Emergency Routes ──────────────────────────────────────────────
app.use("/api/v1/emergency", emergencyRoutes);

// ─── Protected Connection Routes ─────────────────────────────────────────────
app.use("/api/v1/connection", connectionRoutes);

// ─── Protected Offline Batched Synchronization Routes (Phase 11) ─────────────
app.use("/api/v1/sync", syncRoutes);

// ─── Protected Notification Routes ─────────────────────────────────────────────
app.use("/api/v1/notifications", notificationRoutes);

// ─── Protected AI Endpoints ──────────────────────────────────────────────────
app.use("/api/v1/ai", aiRoutes);


// ─── Health Checks ────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "SithaMithuru Backend API is running", version: "2.0.0" });
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// DB Health Check endpoint — verifies live database connectivity
app.get("/api/db-health", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    res.status(200).json({
      status: "✅ Database Connected",
      database: process.env.DB_NAME || "sithamithuru",
      tables: result.rows.map((r: any) => r.table_name),
      tableCount: result.rows.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: "❌ Database Error",
      error: error.message,
    });
  }
});

// Global Centralized Error Handler (must be registered after all route definitions)
app.use(errorHandler);


// ─── HTTP Server & Sockets ────────────────────────────────────────────────────
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Register the io instance with the IoProvider to break circular imports.
// emergencyController.ts and any other module must use getIo() instead of
// importing `io` directly from server.ts.
setIo(io);

// Initialize socket connection logic
initSocketHandler(io);

// ─── Start ────────────────────────────────────────────────────
initCronJobs();
connectDB();

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;

