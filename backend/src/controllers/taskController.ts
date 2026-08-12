import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { asyncHandler } from "../middlewares/asyncHandler";
import { sendSuccess } from "../utils/responseWrapper";
import { AppError } from "../utils/AppError";
import * as taskService from "../services/taskService";

// GET /api/v1/tasks/elder/:elderId — Today's tasks with completion status
export const getTasksByElder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elderId } = req.params;
  const result = await taskService.getTasksByElder(elderId, req.user);
  return sendSuccess(res, result);
});

// POST /api/v1/tasks — Create a new daily task
export const createTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elder_id, title, description, due_time } = req.body;
  if (!elder_id || !title) {
    throw AppError.badRequest("elder_id and title are required");
  }

  const created = await taskService.createTask(
    { elder_id, title, description, due_time, createdBy: req.user?.id || elder_id },
    req.user
  );
  return sendSuccess(res, created, undefined, 201);
});

// PUT /api/v1/tasks/:id — Edit a task
export const updateTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updated = await taskService.updateTask(id, req.body, req.user);
  return sendSuccess(res, updated);
});

// DELETE /api/v1/tasks/:id — Delete a task
export const deleteTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const result = await taskService.deleteTask(id, req.user);
  return sendSuccess(res, result);
});

// POST /api/v1/tasks/log — Toggle task complete/incomplete for today
export const logTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { task_id, elder_id, completed } = req.body;
  if (!task_id || !elder_id) {
    throw AppError.badRequest("task_id and elder_id are required");
  }

  const logged = await taskService.logTask(
    { taskId: task_id, elderId: elder_id, completed: !!completed },
    req.user
  );
  return sendSuccess(res, logged);
});

// GET /api/v1/tasks/upcoming/:elderId — For dashboard reminders
export const getUpcomingTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elderId } = req.params;
  const upcoming = await taskService.getUpcomingTasks(elderId, req.user);
  return sendSuccess(res, upcoming);
});
