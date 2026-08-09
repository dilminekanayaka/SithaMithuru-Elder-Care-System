import { Router } from "express";
import { getAiConfig, reportFalsePositive } from "../controllers/aiController";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

router.use(protect);

router.get("/config", getAiConfig);
router.post("/false-positive", reportFalsePositive);

export default router;
