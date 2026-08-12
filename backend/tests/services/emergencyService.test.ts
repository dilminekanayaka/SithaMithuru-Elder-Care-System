import * as emergencyService from "../../src/services/emergencyService";
import * as emergencyRepository from "../../src/repositories/emergencyRepository";
import { setIo } from "../../src/utils/ioProvider";

jest.mock("../../src/repositories/emergencyRepository");
jest.mock("../../src/services/connectionService");
jest.mock("../../src/config/firebase", () => ({
  sendPushNotification: jest.fn(),
}));

describe("emergencyService Unit Tests", () => {
  let mockEmit: jest.Mock;
  let mockTo: jest.Mock;

  beforeEach(() => {
    mockEmit = jest.fn();
    mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
    setIo({ to: mockTo, emit: mockEmit } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("triggerSOS", () => {
    it("should throw forbidden error if Elder tries to trigger SOS for another Elder", async () => {
      await expect(
        emergencyService.triggerSOS({ elder_id: "elder-2" }, { id: "elder-1", role: "Elder" })
      ).rejects.toThrow("Forbidden: You cannot trigger SOS for another user");
    });

    it("should insert log and notify guardians when valid", async () => {
      (emergencyRepository.insertEmergencyLog as jest.Mock).mockResolvedValue({ id: "sos-100", elder_id: "elder-1" });
      (emergencyRepository.findLinkedGuardianUserIds as jest.Mock).mockResolvedValue({
        elderName: "Nimal Perera",
        guardianIds: [10],
      });
      (emergencyRepository.findGuardianFcmTokens as jest.Mock).mockResolvedValue([]);

      const log = await emergencyService.triggerSOS({ elder_id: "elder-1" }, { id: "elder-1", role: "Elder" });
      expect(log.id).toBe("sos-100");
      expect(emergencyRepository.insertEmergencyLog).toHaveBeenCalled();
    });
  });

  describe("cancelSOS", () => {
    it("should allow Elder to cancel their own active SOS", async () => {
      (emergencyRepository.findEmergencyLogById as jest.Mock).mockResolvedValue({ id: "sos-1", elder_id: "elder-1" });
      (emergencyRepository.resolveEmergencyLog as jest.Mock).mockResolvedValue({ id: "sos-1", status: "False Alarm" });
      (emergencyRepository.findLinkedGuardianUserIds as jest.Mock).mockResolvedValue({ elderName: "Nimal", guardianIds: [] });

      const res = await emergencyService.cancelSOS("sos-1", { id: "elder-1", role: "Elder" });
      expect(res.status).toBe("False Alarm");
    });
  });
});
