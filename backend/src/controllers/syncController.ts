import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { logger } from "../utils/logger";
import * as syncService from "../services/syncService";

export const syncBatch = async (req: AuthRequest, res: Response) => {
  try {
    const { elder_id } = req.body;
    if (!elder_id) {
      return res.status(400).json({ message: "elder_id is required for batch sync" });
    }

    const result = await syncService.processBatchSync(req.body);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    logger.error("Sync Batch Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Server error processing batch synchronization",
    });
  }
};
