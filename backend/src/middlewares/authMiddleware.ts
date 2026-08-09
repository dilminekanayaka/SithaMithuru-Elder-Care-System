import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// SECURITY: Fail hard at startup if JWT_SECRET is not set.
if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is not set. Server cannot start.");
}
const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}


// Verifies the Bearer token on every request. Attaches decoded user to req.user.
export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};


// Role-based authorization guard. Must be used AFTER the protect middleware.

export const requireRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No user context" });
    }
    if (req.user.role !== role) {
      return res.status(403).json({
        message: `Forbidden: This action requires the '${role}' role. Your role is '${req.user.role}'.`,
      });
    }
    return next();
  };
};