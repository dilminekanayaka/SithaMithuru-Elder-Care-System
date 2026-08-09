import rateLimit from "express-rate-limit";

// SECURITY FIX #18: Production-appropriate rate limits.
// Previous limits were development-tuned (2000 API / 200 auth per 15 min).

// General API rate limiter — protects all /api/ routes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per IP per 15 min (was 2000 — development value)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});

// Auth rate limiter — strict limit to prevent brute-force on login/register
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 5 : 100, // 5 in production (Security Audit), 100 in development
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
});

// SECURITY FIX #18 (partial): Invite code validation limiter.
// Prevents brute-force guessing of SM-XXXX-XXXX invite codes.
// The /api/connection/invite endpoint has an in-DB per-user limit (max 5/day).
// This limiter protects the /api/connection/validate endpoint specifically.
export const connectionValidateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 validation attempts per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many invite code attempts. Please try again after 15 minutes.",
  },
});
