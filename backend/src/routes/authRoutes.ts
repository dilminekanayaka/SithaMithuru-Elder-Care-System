import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  refreshUserToken,
} from "../controllers/authController";
import { authLimiter } from "../middlewares/rateLimiter";
import {
  registerValidationRules,
  loginValidationRules,
  forgotPasswordValidationRules,
  resetPasswordValidationRules,
} from "../middlewares/validationMiddleware";

const router = Router();

// Public routes with rate limiting and validation
router.post("/register", authLimiter, registerValidationRules, registerUser);
router.post("/login", authLimiter, loginValidationRules, loginUser);
router.post("/logout", logoutUser);
router.post("/refresh", authLimiter, refreshUserToken);
router.post("/forgot-password", authLimiter, forgotPasswordValidationRules, forgotPassword);
router.post("/reset-password", authLimiter, resetPasswordValidationRules, resetPassword);



export default router;
