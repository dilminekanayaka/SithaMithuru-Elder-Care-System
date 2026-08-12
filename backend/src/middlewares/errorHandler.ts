import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { AppError } from "../utils/AppError";

// Maps common Postgres error codes to an HTTP status + friendlier message,
// so a raw driver error (e.g. a UNIQUE violation) never surfaces to the
// client as an opaque generic 500.
// https://www.postgresql.org/docs/current/errcodes-appendix.html
const PG_ERROR_STATUS: Record<string, { status: number; message: string }> = {
  "23505": { status: 409, message: "A record with this value already exists" },
  "23503": { status: 400, message: "This action references a record that does not exist" },
  "23502": { status: 400, message: "A required field is missing" },
  "23514": { status: 400, message: "The provided value violates a data constraint" },
};

/**
 * Global centralized error handler middleware.
 * Intercepts every error forwarded via next(err) (including from asyncHandler-
 * wrapped controllers) and formats it as the same structured JSON envelope
 * `sendSuccess`/`sendError` (utils/responseWrapper.ts) use, so API consumers
 * never see two different error shapes depending on whether a controller
 * caught its own error or let it bubble up here.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let details: any = err instanceof AppError ? err.details : undefined;

  if (err.code && PG_ERROR_STATUS[err.code]) {
    statusCode = PG_ERROR_STATUS[err.code].status;
    message = PG_ERROR_STATUS[err.code].message;
  } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Invalid or expired token";
  }

  const logLevel = statusCode >= 500 ? "error" : "warn";
  logger[logLevel](
    `[ERROR HANDLER] ${req.method} ${req.url} - Status ${statusCode} - ${message}`,
    statusCode >= 500 ? err : undefined
  );

  res.status(statusCode).json({
    success: false,
    data: null,
    meta: null,
    error: {
      message,
      details: details || null,
      // Stack trace only in development — never leak internals to a client.
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    },
  });
};
