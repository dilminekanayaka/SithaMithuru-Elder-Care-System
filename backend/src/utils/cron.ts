import cron from "node-cron";
import pool from "../config/db";
import { calculateRiskProfile } from "../services/riskEngine";
import { logger } from "./logger";

/**
 * Initializes scheduled background tasks.
 * Performs a nightly risk profile calculation audit for all elders.
 */
export const initCronJobs = () => {
  // Run every night at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    logger.info("⏰ [CRON] Starting nightly risk profile audit run...");
    try {
      // Fetch all user accounts with the 'Elder' role
      const eldersRes = await pool.query(
        "SELECT id, name FROM users WHERE role = 'Elder'"
      );
      const elders = eldersRes.rows;

      logger.info(`⏰ [CRON] Found ${elders.length} active elders to audit.`);

      for (const elder of elders) {
        try {
          const profile = await calculateRiskProfile(elder.id);
          logger.info(
            `📊 [CRON] Risk audit for ${elder.name} (ID: ${elder.id}): ` +
            `Score = ${profile.score}, Category = ${profile.category}`
          );
        } catch (elderErr: any) {
          logger.error(
            `❌ [CRON] Failed to calculate risk profile for elder ID ${elder.id}:`,
            elderErr
          );
        }
      }

      logger.info("⏰ [CRON] Nightly risk profile audit run completed successfully.");
    } catch (error: any) {
      logger.error("❌ [CRON] Nightly risk audit process failed:", error);
    }
  });

  logger.info("⏰ Scheduled background cron jobs initialized.");
};
