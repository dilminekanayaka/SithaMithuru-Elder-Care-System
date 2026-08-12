// Operational error thrown deliberately by services/controllers to signal a
// specific HTTP status + message. Distinguishes "expected" failures (not
// found, forbidden, bad input) from genuine bugs/crashes, so errorHandler.ts
// can respond correctly to both without every controller needing its own
// try/catch/log/sendError(500) boilerplate.
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational = true;
  public readonly details?: any;

  constructor(message: string, statusCode = 400, details?: any) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: any) {
    return new AppError(message, 400, details);
  }
  static unauthorized(message = "Unauthorized") {
    return new AppError(message, 401);
  }
  static forbidden(message = "Forbidden") {
    return new AppError(message, 403);
  }
  static notFound(message = "Resource not found") {
    return new AppError(message, 404);
  }
  static conflict(message: string) {
    return new AppError(message, 409);
  }
  static tooManyRequests(message = "Too many requests") {
    return new AppError(message, 429);
  }
}
