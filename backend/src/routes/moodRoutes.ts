import { Router } from "express";
import { getMoodHistory, saveMood } from "../controllers/moodController";
import { protect } from "../middlewares/authMiddleware";
import { authorizeElderAccess } from "../middlewares/authorizationMiddleware";
import { moodValidationRules } from "../middlewares/validationMiddleware";

const router = Router();

router.use(protect);

router.get("/elder/:elderId", authorizeElderAccess, getMoodHistory);
router.post("/", authorizeElderAccess, moodValidationRules, saveMood);

export default router;
