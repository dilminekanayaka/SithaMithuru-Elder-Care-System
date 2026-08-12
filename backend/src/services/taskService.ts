import * as taskRepository from "../repositories/taskRepository";
import { TaskInput } from "../repositories/taskRepository";
import { verifyUserElderAccess, UserContext } from "../utils/accessHelper";
import { AppError } from "../utils/AppError";

export const getTasksByElder = async (elderId: string | number, user?: UserContext) => {
  if (user) {
    await verifyUserElderAccess(user, elderId);
  }

  const tasks = await taskRepository.findTasksByElder(elderId);
  const completedCount = tasks.filter((t: any) => t.completed).length;

  return { tasks, completedCount, totalCount: tasks.length };
};

export const createTask = async (data: TaskInput, user?: UserContext) => {
  if (user) {
    await verifyUserElderAccess(user, data.elder_id);
  }
  return taskRepository.createTask(data);
};

export const updateTask = async (id: string | number, updates: Partial<TaskInput>, user?: UserContext) => {
  const elderId = await taskRepository.findTaskElderId(id);
  if (!elderId) throw AppError.notFound("Task not found");

  if (user) {
    await verifyUserElderAccess(user, elderId);
  }

  const updated = await taskRepository.updateTask(id, updates);
  if (!updated) throw AppError.notFound("Task not found");
  return updated;
};

export const deleteTask = async (id: string | number, user?: UserContext) => {
  const elderId = await taskRepository.findTaskElderId(id);
  if (!elderId) throw AppError.notFound("Task not found");

  if (user) {
    await verifyUserElderAccess(user, elderId);
  }

  const deleted = await taskRepository.deleteTask(id);
  if (!deleted) throw AppError.notFound("Task not found");
  return { message: "Task deleted successfully" };
};

export const logTask = async (
  logData: { taskId: string | number; elderId: string | number; completed: boolean },
  user?: UserContext
) => {
  if (user) {
    await verifyUserElderAccess(user, logData.elderId);
  }
  return taskRepository.upsertTaskLog(logData);
};

export const getUpcomingTasks = async (elderId: string | number, user?: UserContext) => {
  if (user) {
    await verifyUserElderAccess(user, elderId);
  }
  return taskRepository.findUpcomingTasks(elderId);
};

export const getTaskHistory = async (elderId: string | number, days: number = 30, user?: UserContext) => {
  if (user) {
    await verifyUserElderAccess(user, elderId);
  }
  const events = await taskRepository.findTaskHistory(elderId, days);
  const completed = events.filter((e: any) => e.status === "COMPLETED").length;
  const missed = events.filter((e: any) => e.status === "MISSED").length;
  const total = completed + missed;
  const adherencePct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { events, summary: { completed, missed, total, adherencePct } };
};
