import { Router } from "express";
import { getNotifications, clearNotification, markNotificationRead } from "../controllers/notificationController";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

router.use(protect);

router.get("/", getNotifications);
router.put("/:id/read", markNotificationRead);
router.delete("/:id", clearNotification);

export default router;
