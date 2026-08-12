import { Router } from "express";
import {
  generateInvite,
  validateInvite,
  getPendingRequests,
  respondToRequest,
  unlinkConnection,
  getMyGuardians,
} from "../controllers/connectionController";
import { protect } from "../middlewares/authMiddleware";
import { connectionValidationRules } from "../middlewares/validationMiddleware";
import { connectionValidateLimiter } from "../middlewares/rateLimiter";

const router = Router();

// Secure all connection routes
router.use(protect);

router.post("/invite", generateInvite);
// SECURITY FIX #18: Apply brute-force rate limit on validate (invite code guessing)
router.post("/validate", connectionValidateLimiter, connectionValidationRules, validateInvite);
router.get("/pending", getPendingRequests);
router.get("/my-guardians", getMyGuardians);
router.put("/respond/:requestId", respondToRequest);
router.delete("/unlink", unlinkConnection);

export default router;
