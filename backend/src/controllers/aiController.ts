import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { sendSuccess, sendError } from "../utils/responseWrapper";
import { logger } from "../utils/logger";

// GET /api/v1/ai/config
export const getAiConfig = async (req: AuthRequest, res: Response) => {
  try {
    // In a real app, this might come from the database or environment variables
    const config = {
      model_version: "v1.0.0",
      confidence_threshold: 0.85,
      enabled_features: ["fall_detection", "voice_sos"],
      audio_snr_threshold_db: 15.0,
    };
    return sendSuccess(res, config);
  } catch (error) {
    logger.error("Get AI Config Error:", error);
    return sendError(res, "Server error fetching AI config", 500);
  }
};

// POST /api/v1/ai/false-positive
export const reportFalsePositive = async (req: AuthRequest, res: Response) => {
  try {
    const { log_id, model_type, notes } = req.body;
    
    if (!log_id || !model_type) {
      return sendError(res, "log_id and model_type are required", 400);
    }

    // In a real app, we would log this to a feedback table for retraining
    logger.info(`False positive reported for ${model_type} on log ${log_id}. Notes: ${notes || 'none'}`);

    return sendSuccess(res, { message: "False positive reported successfully. Thank you for your feedback." }, undefined, 201);
  } catch (error) {
    logger.error("Report False Positive Error:", error);
    return sendError(res, "Server error reporting false positive", 500);
  }
};
