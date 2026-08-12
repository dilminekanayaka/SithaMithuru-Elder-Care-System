import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { syncBatch } from "../controllers/syncController";
import { authorizeElderAccess } from "../middlewares/authorizationMiddleware";

const router = Router();

// Protected batched synchronization endpoint for offline-first queues
router.post("/batch", protect, authorizeElderAccess, syncBatch);

export default router;
