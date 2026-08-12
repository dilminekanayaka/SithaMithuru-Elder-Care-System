import * as taskService from "../../src/services/taskService";
import * as taskRepository from "../../src/repositories/taskRepository";
import * as connectionService from "../../src/services/connectionService";

jest.mock("../../src/repositories/taskRepository");
jest.mock("../../src/services/connectionService");

describe("taskService Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getTasksByElder", () => {
    it("should calculate completedCount correctly", async () => {
      (taskRepository.findTasksByElder as jest.Mock).mockResolvedValue([
        { id: "t1", title: "Morning Walk", completed: true },
        { id: "t2", title: "Drink Water", completed: false },
      ]);

      const res = await taskService.getTasksByElder("elder-1");
      expect(res.totalCount).toBe(2);
      expect(res.completedCount).toBe(1);
    });
  });

  describe("deleteTask", () => {
    it("should verify link when caller is Guardian", async () => {
      (taskRepository.findTaskElderId as jest.Mock).mockResolvedValue("elder-10");
      (connectionService.verifyGuardianElderLink as jest.Mock).mockResolvedValue(undefined);
      (taskRepository.deleteTask as jest.Mock).mockResolvedValue({ id: "t1" });

      const res = await taskService.deleteTask("t1", { id: "guardian-5", role: "Guardian" });
      expect(connectionService.verifyGuardianElderLink).toHaveBeenCalledWith("guardian-5", "elder-10");
      expect(res.message).toBe("Task deleted successfully");
    });
  });
});
