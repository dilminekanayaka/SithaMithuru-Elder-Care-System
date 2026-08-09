import { Router } from "express";
import { getNotifications, clearNotification } from "../controllers/notificationController";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

router.use(protect);

router.get("/", getNotifications);
router.delete("/:id", clearNotification);

export default router;
