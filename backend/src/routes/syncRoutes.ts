import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { syncBatch } from "../controllers/syncController";

const router = Router();

// Protected batched synchronization endpoint for offline-first queues
router.post("/batch", protect, syncBatch);

export default router;
