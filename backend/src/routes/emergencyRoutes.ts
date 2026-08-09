import { Router } from "express";
import {
  triggerSOS,
  resolveEmergency,
  cancelSOS,
} from "../controllers/emergencyController";
import { protect } from "../middlewares/authMiddleware";
import { authorizeElderAccess } from "../middlewares/authorizationMiddleware";

const router = Router();

// All emergency routes require token validation
router.use(protect);

router.post("/trigger", authorizeElderAccess, triggerSOS);
router.put("/:id/resolve", resolveEmergency);
router.put("/:id/cancel", cancelSOS);

export default router;
