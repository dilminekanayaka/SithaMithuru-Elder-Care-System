import * as notificationService from "../../src/services/notificationService";
import * as notificationRepository from "../../src/repositories/notificationRepository";

jest.mock("../../src/repositories/notificationRepository");

describe("notificationService Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getNotificationsForUser", () => {
    it("should return persistent notifications if available", async () => {
      (notificationRepository.findNotificationsByUser as jest.Mock).mockResolvedValue([
        { id: 1, title: "Test Alert", message: "Test Message", is_read: false },
      ]);
      (notificationRepository.countNotificationsByUser as jest.Mock).mockResolvedValue(1);

      const res = await notificationService.getNotificationsForUser({ id: "u-1", role: "Elder" });
      expect(res.notifications).toHaveLength(1);
      expect(notificationRepository.synthesizeElderNotifications).not.toHaveBeenCalled();
    });

    it("should synthesize dynamic notifications when persistent table is empty for Elder", async () => {
      (notificationRepository.findNotificationsByUser as jest.Mock).mockResolvedValue([]);
      (notificationRepository.synthesizeElderNotifications as jest.Mock).mockResolvedValue([
        { id: "sos-1", title: "Emergency Alert", message: "SOS recorded" },
      ]);

      const res = await notificationService.getNotificationsForUser({ id: "elder-1", role: "Elder" });
      expect(notificationRepository.synthesizeElderNotifications).toHaveBeenCalledWith("elder-1");
      expect(res.notifications).toHaveLength(1);
    });
  });

  describe("markNotificationRead", () => {
    it("should no-op for synthesized non-numeric IDs", async () => {
      const res = await notificationService.markNotificationRead("sos-100", { id: "u-1", role: "Elder" });
      expect(res.message).toBe("Notification marked as read");
      expect(notificationRepository.markNotificationRead).not.toHaveBeenCalled();
    });

    it("should update DB for numeric IDs", async () => {
      (notificationRepository.markNotificationRead as jest.Mock).mockResolvedValue(undefined);

      const res = await notificationService.markNotificationRead("42", { id: "u-1", role: "Elder" });
      expect(notificationRepository.markNotificationRead).toHaveBeenCalledWith("42", "u-1");
      expect(res.message).toBe("Notification marked as read");
    });
  });
});
