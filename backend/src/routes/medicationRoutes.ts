import { Router } from "express";
import {
  getMedicationsByElder,
  createMedication,
  updateMedication,
  deleteMedication,
  logMedication,
  getUpcomingMedications,
  getMedicationDictionary,
} from "../controllers/medicationController";
import { protect } from "../middlewares/authMiddleware";
import { authorizeElderAccess } from "../middlewares/authorizationMiddleware";
import {
  medicationValidationRules,
  medicationLogValidationRules,
} from "../middlewares/validationMiddleware";

const router = Router();

router.get("/dictionary", getMedicationDictionary);

router.use(protect);
router.get("/elder/:elderId", authorizeElderAccess, getMedicationsByElder);
router.get("/upcoming/:elderId", authorizeElderAccess, getUpcomingMedications);
router.post("/", authorizeElderAccess, medicationValidationRules, createMedication);
router.put("/:id", medicationValidationRules, updateMedication);
router.delete("/:id", deleteMedication);
router.post("/log", authorizeElderAccess, medicationLogValidationRules, logMedication);

export default router;
