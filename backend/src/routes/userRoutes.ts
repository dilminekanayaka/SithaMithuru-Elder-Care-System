import { Router } from "express";
import { updateProfile, getUserById, getAllGuardians } from "../controllers/userController";

const router = Router();

router.get("/:id", getUserById);
router.put("/:id", updateProfile);
router.get("/guardians/all", getAllGuardians);

export default router;
