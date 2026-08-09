import { Router } from "express";
import { updateProfile, getUserById, getAllGuardians, registerFcmToken, deleteAccount } from "../controllers/userController";
import { protect } from "../middlewares/authMiddleware";
import { profileValidationRules } from "../middlewares/validationMiddleware";

const router = Router();

// All user routes require authentication
router.use(protect);

// SECURITY FIX #21: '/guardians/all' must be registered BEFORE '/:id' to avoid
// being matched by the /:id dynamic pattern with id='guardians'.
router.get("/guardians/all", getAllGuardians);

router.get("/:id", getUserById);
router.put("/:id", profileValidationRules, updateProfile);
router.delete("/:id", deleteAccount);
router.post("/fcm-token", registerFcmToken);

// NOTE: requestLink (elder → guardian link request via email) has been moved
// to guardianRoutes.ts (/api/guardian/link-request) — see SECURITY FIX #cross-contamination.

export default router;
