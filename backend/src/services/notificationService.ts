import * as notificationRepository from "../repositories/notificationRepository";
import { NotificationInput } from "../repositories/notificationRepository";
import { AppError } from "../utils/AppError";

type UserContext = { id: string | number; role: string };

export const getNotificationsForUser = async (user: UserContext, limit: number = 20, offset: number = 0) => {
  const rows = await notificationRepository.findNotificationsByUser(user.id, limit, offset);

  if (rows.length === 0) {
    if (user.role === "Elder") {
      const synthesized = await notificationRepository.synthesizeElderNotifications(user.id);
      return {
        notifications: synthesized,
        pagination: { page: 1, limit: synthesized.length, total: synthesized.length, total_pages: 1, has_more: false },
      };
    } else if (user.role === "Guardian") {
      const synthesized = await notificationRepository.synthesizeGuardianNotifications(user.id);
      return {
        notifications: synthesized,
        pagination: { page: 1, limit: synthesized.length, total: synthesized.length, total_pages: 1, has_more: false },
      };
    }
  }

  const total = await notificationRepository.countNotificationsByUser(user.id);
  const totalPages = Math.ceil(total / limit);
  const hasMore = offset + limit < total;
  const page = Math.floor(offset / limit) + 1;

  return {
    notifications: rows,
    pagination: { page, limit, total, total_pages: totalPages, has_more: hasMore },
  };
};

export const markNotificationRead = async (id: string, user: UserContext) => {
  if (!/^\d+$/.test(id)) {
    return { message: "Notification marked as read" };
  }
  await notificationRepository.markNotificationRead(id, user.id);
  return { message: "Notification marked as read" };
};

export const clearNotification = async (id: string, user: UserContext) => {
  const deleted = await notificationRepository.deleteNotification(id, user.id);
  if (!deleted) throw AppError.notFound("Notification not found or unauthorized");
  return { message: "Notification cleared successfully" };
};

export const createNotification = async (data: NotificationInput) => {
  return notificationRepository.insertNotification(data);
};
