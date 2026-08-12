import { Router } from "express";
import {
  triggerSOS,
  resolveEmergency,
  cancelSOS,
  getElderEmergencyLogs,
} from "../controllers/emergencyController";
import { protect } from "../middlewares/authMiddleware";
import { authorizeElderAccess } from "../middlewares/authorizationMiddleware";

const router = Router();

// All emergency routes require token validation
router.use(protect);

router.post("/trigger", authorizeElderAccess, triggerSOS);
router.get("/elder/:elderId", authorizeElderAccess, getElderEmergencyLogs);
router.put("/:id/resolve", resolveEmergency);
router.put("/:id/cancel", cancelSOS);

export default router;
