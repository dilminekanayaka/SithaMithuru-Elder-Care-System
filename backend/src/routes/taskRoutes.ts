import { Router } from "express";
import {
  getTasksByElder,
  createTask,
  updateTask,
  deleteTask,
  logTask,
  getUpcomingTasks,
} from "../controllers/taskController";
import { protect } from "../middlewares/authMiddleware";
import { authorizeElderAccess } from "../middlewares/authorizationMiddleware";
import { taskValidationRules } from "../middlewares/validationMiddleware";

const router = Router();

router.use(protect);

router.get("/elder/:elderId", authorizeElderAccess, getTasksByElder);
router.get("/upcoming/:elderId", authorizeElderAccess, getUpcomingTasks);
router.post("/", authorizeElderAccess, taskValidationRules, createTask);
router.put("/:id", taskValidationRules, updateTask);
router.delete("/:id", deleteTask);
router.post("/log", authorizeElderAccess, logTask);

export default router;
