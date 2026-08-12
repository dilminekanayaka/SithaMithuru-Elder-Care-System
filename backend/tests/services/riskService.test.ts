import * as riskService from "../../src/services/riskService";
import * as riskEngine from "../../src/services/riskEngine";
import * as connectionService from "../../src/services/connectionService";

jest.mock("../../src/services/riskEngine");
jest.mock("../../src/services/connectionService");

describe("riskService Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getElderRiskProfile", () => {
    it("should throw badRequest if elderId is missing", async () => {
      await expect(riskService.getElderRiskProfile("")).rejects.toThrow("elderId is required");
    });

    it("should verify link and calculate risk profile for Guardian", async () => {
      (connectionService.verifyGuardianElderLink as jest.Mock).mockResolvedValue(undefined);
      (riskEngine.calculateRiskProfile as jest.Mock).mockResolvedValue({
        score: 15,
        category: "Low",
        factors: {},
        recommendations: ["Keep up good monitoring!"],
      });

      const profile = await riskService.getElderRiskProfile("elder-1", { id: "g-1", role: "Guardian" });
      expect(connectionService.verifyGuardianElderLink).toHaveBeenCalledWith("g-1", "elder-1");
      expect(profile.category).toBe("Low");
    });
  });
});
