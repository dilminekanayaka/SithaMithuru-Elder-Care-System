import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * Global centralized error handler middleware.
 * Intercepts all unhandled errors thrown inside express routes and
 * formats them as structured JSON, preventing runtime stacks from leaking.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error(
    `[ERROR HANDLER] ${req.method} ${req.url} - Status ${statusCode} - Error: ${message}`,
    err
  );

  res.status(statusCode).json({
    success: false,
    message,
    // Stack trace is only exposed in development environment for debugging
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

