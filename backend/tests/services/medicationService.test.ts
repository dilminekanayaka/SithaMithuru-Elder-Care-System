import * as medicationService from "../../src/services/medicationService";
import * as medicationRepository from "../../src/repositories/medicationRepository";
import * as connectionService from "../../src/services/connectionService";

jest.mock("../../src/repositories/medicationRepository");
jest.mock("../../src/services/connectionService");

describe("medicationService Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getMedicationsByElder", () => {
    it("should enforce guardian authorization check when caller is a Guardian", async () => {
      (connectionService.verifyGuardianElderLink as jest.Mock).mockResolvedValue(undefined);
      (medicationRepository.findMedicationsByElder as jest.Mock).mockResolvedValue([
        { id: "m1", name: "Paracetamol", time_schedule: "08:00", taken: true },
      ]);

      const res = await medicationService.getMedicationsByElder("elder-1", { id: "g-1", role: "Guardian" });

      expect(connectionService.verifyGuardianElderLink).toHaveBeenCalledWith("g-1", "elder-1");
      expect(res.totalMeds).toBe(1);
      expect(res.takenMeds).toBe(1);
    });

    it("should skip guardian link check for Elder self-access", async () => {
      (medicationRepository.findMedicationsByElder as jest.Mock).mockResolvedValue([]);

      await medicationService.getMedicationsByElder("elder-1", { id: "elder-1", role: "Elder" });

      expect(connectionService.verifyGuardianElderLink).not.toHaveBeenCalled();
    });
  });

  describe("updateMedication", () => {
    it("should throw notFound if medication does not exist", async () => {
      (medicationRepository.findMedicationElderId as jest.Mock).mockResolvedValue(null);

      await expect(
        medicationService.updateMedication("m999", { name: "New Name" }, { id: "elder-1", role: "Elder" })
      ).rejects.toThrow("Medication not found or inactive");
    });

    it("should call updateMedication after authorization check", async () => {
      (medicationRepository.findMedicationElderId as jest.Mock).mockResolvedValue("elder-1");
      (connectionService.verifyGuardianElderLink as jest.Mock).mockResolvedValue(undefined);
      (medicationRepository.updateMedication as jest.Mock).mockResolvedValue({ id: "m1", name: "New Name" });

      const res = await medicationService.updateMedication("m1", { name: "New Name" }, { id: "g-1", role: "Guardian" });

      expect(connectionService.verifyGuardianElderLink).toHaveBeenCalledWith("g-1", "elder-1");
      expect(res.name).toBe("New Name");
    });
  });
});
