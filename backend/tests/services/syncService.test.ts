import * as syncService from "../../src/services/syncService";
import * as syncRepository from "../../src/repositories/syncRepository";
import { notifyGuardiansOfEmergency } from "../../src/services/emergencyService";

jest.mock("../../src/repositories/syncRepository");
jest.mock("../../src/services/emergencyService", () => ({
  notifyGuardiansOfEmergency: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../src/config/db", () => {
  const mClient = {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    release: jest.fn(),
  };
  const mockConnect = jest.fn().mockResolvedValue(mClient);
  return {
    __esModule: true,
    connect: mockConnect,
    default: {
      connect: mockConnect,
      query: jest.fn().mockResolvedValue({ rows: [] }),
    },
  };
});

describe("syncService Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("processBatchSync", () => {
    it("should throw badRequest if elder_id is missing", async () => {
      await expect(syncService.processBatchSync({ elder_id: "" })).rejects.toThrow(
        "elder_id is required for batch sync"
      );
    });

    it("should process medication, task, and emergency items in a transaction", async () => {
      (syncRepository.syncMedicationItem as jest.Mock).mockResolvedValue(undefined);
      (syncRepository.syncTaskItem as jest.Mock).mockResolvedValue(undefined);
      (syncRepository.syncEmergencyItem as jest.Mock).mockResolvedValue({ id: "sos-1" });

      const res = await syncService.processBatchSync({
        elder_id: "elder-1",
        medication_logs: [{ client_id: "med-c1", medication_id: "m1", status: "TAKEN" }],
        task_logs: [{ client_id: "task-c1", task_id: "t1", status: "COMPLETED" }],
        emergency_logs: [{ client_id: "sos-c1", triggered_phrase: "Voice SOS" }],
      });

      expect(res.processed.medication_ids).toContain("med-c1");
      expect(res.processed.task_ids).toContain("task-c1");
      expect(res.processed.emergency_ids).toContain("sos-c1");
      expect(notifyGuardiansOfEmergency).toHaveBeenCalledWith("elder-1", { id: "sos-1" });
    });

    it("should process emergency logs with highest notification priority when sync occurs", async () => {
      (syncRepository.syncEmergencyItem as jest.Mock).mockResolvedValue({ id: "critical-sos-99" });

      const res = await syncService.processBatchSync({
        elder_id: "elder-42",
        emergency_logs: [{ client_id: "emg-client-99", triggered_phrase: "Help me" }],
      });

      expect(res.processed.emergency_ids).toEqual(["emg-client-99"]);
      expect(notifyGuardiansOfEmergency).toHaveBeenCalledTimes(1);
      expect(notifyGuardiansOfEmergency).toHaveBeenCalledWith("elder-42", { id: "critical-sos-99" });
    });

    it("should handle partial failures cleanly without failing the entire batch", async () => {
      (syncRepository.syncMedicationItem as jest.Mock).mockResolvedValue(undefined);
      (syncRepository.syncTaskItem as jest.Mock).mockRejectedValue(new Error("Constraint violation"));

      const res = await syncService.processBatchSync({
        elder_id: "elder-1",
        medication_logs: [{ client_id: "med-c1", medication_id: "m1", status: "TAKEN" }],
        task_logs: [{ client_id: "task-bad", task_id: "t1", status: "COMPLETED" }],
      });

      expect(res.processed.medication_ids).toContain("med-c1");
      expect(res.errors).toHaveLength(1);
      expect(res.errors[0]).toEqual({
        table: "task_logs",
        client_id: "task-bad",
        reason: "Constraint violation",
      });
    });
  });
});
