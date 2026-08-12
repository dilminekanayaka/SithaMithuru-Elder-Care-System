import * as connectionService from "../../src/services/connectionService";
import * as connectionRepository from "../../src/repositories/connectionRepository";
import { AppError } from "../../src/utils/AppError";

jest.mock("../../src/repositories/connectionRepository");
jest.mock("../../src/repositories/authRepository");
jest.mock("../../src/config/transaction", () => ({
  withTransaction: jest.fn((cb) => cb({})),
}));

describe("connectionService Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("generateInvite", () => {
    it("should throw tooManyRequests when user exceeds daily invite limit", async () => {
      (connectionRepository.countRecentInvitesByUser as jest.Mock).mockResolvedValue(5);

      await expect(connectionService.generateInvite("user-1", "Elder")).rejects.toThrow(
        "Daily invitation limit reached (Max 5 per day)."
      );
    });

    it("should generate and insert an invitation token when under limit", async () => {
      (connectionRepository.countRecentInvitesByUser as jest.Mock).mockResolvedValue(2);
      (connectionRepository.insertInvitation as jest.Mock).mockResolvedValue({
        id: "inv-1",
        token: "SM-1234-ABCD",
        expires_at: new Date(),
      });

      const res = await connectionService.generateInvite("user-1", "Elder");
      expect(res.token).toBe("SM-1234-ABCD");
      expect(connectionRepository.insertConnectionLog).toHaveBeenCalled();
    });
  });

  describe("verifyGuardianElderLink", () => {
    it("should resolve when active link exists", async () => {
      (connectionRepository.findActiveRelationship as jest.Mock).mockResolvedValue({ status: "ACTIVE" });

      await expect(connectionService.verifyGuardianElderLink("g-1", "e-1")).resolves.toBeUndefined();
    });

    it("should throw forbidden error when no active link exists", async () => {
      (connectionRepository.findActiveRelationship as jest.Mock).mockResolvedValue(null);

      await expect(connectionService.verifyGuardianElderLink("g-1", "e-1")).rejects.toThrow(
        "Forbidden: You are not authorized for this elder"
      );
    });
  });

  describe("generateElderInviteCode", () => {
    it("should generate 6-character code and insert invitation", async () => {
      (connectionRepository.insertElderInvitation as jest.Mock).mockResolvedValue(undefined);

      const res = await connectionService.generateElderInviteCode("guardian-10");
      expect(res.invite_code).toHaveLength(6);
      expect(res.qr_payload).toContain("SITHAMITHURU_INVITE");
      expect(connectionRepository.insertElderInvitation).toHaveBeenCalled();
    });
  });
});
