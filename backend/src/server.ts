import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { validateEnvironment } from "./config/env";

dotenv.config();
// Must run before any other config module (esp. Firebase) is imported, so a
// missing/insecure production configuration fails the boot immediately
// instead of partially initializing.
validateEnvironment();

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

const app = express();
const PORT = process.env.PORT || 5000;

const isProduction = process.env.NODE_ENV === "production";
// CORS_ORIGIN may be a single origin or a comma-separated list.
const parseCorsOrigin = (value: string): string | string[] => {
  const origins = value.split(",").map((o) => o.trim()).filter(Boolean);
  return origins.length > 1 ? origins : origins[0];
};
// In production, validateEnvironment() above already guarantees CORS_ORIGIN
// is set to a real (non-"*") value — no localhost/wildcard fallback here.
// In development, "*" remains the convenient default so local/device testing
// isn't blocked by CORS.
const corsOrigin = isProduction
  ? parseCorsOrigin(process.env.CORS_ORIGIN as string)
  : process.env.CORS_ORIGIN
  ? parseCorsOrigin(process.env.CORS_ORIGIN)
  : "*";

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

// Defensive: an unhandled 'error' event on an idle pool client would otherwise
// crash the whole process (a well-known pg.Pool gotcha).
pool.on("error", (err) => {
  console.error("❌ Unexpected PostgreSQL pool error:", err);
});

// ─── Start ────────────────────────────────────────────────────
// connectDB() is awaited before the server accepts traffic — previously it was
// fire-and-forget, so /health could report OK during a window where the app
// genuinely couldn't serve any DB-backed request yet.
(async () => {
  await connectDB();
  initCronJobs();

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();

// ─── Graceful Shutdown ────────────────────────────────────────
// Container orchestrators / most PaaS send SIGTERM before force-killing.
// Without this, in-flight requests get cut off and DB connections leak.
let shuttingDown = false;
const shutdown = (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} received — shutting down gracefully...`);

  const forceExitTimer = setTimeout(() => {
    console.error("⚠️ Graceful shutdown timed out — forcing exit.");
    process.exit(1);
  }, 10000);

  io.close(() => {
    httpServer.close(async () => {
      try {
        await pool.end();
        console.log("✅ HTTP server, sockets, and DB pool closed cleanly.");
        clearTimeout(forceExitTimer);
        process.exit(0);
      } catch (err) {
        console.error("❌ Error during shutdown:", err);
        clearTimeout(forceExitTimer);
        process.exit(1);
      }
    });
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default app;

