import pool from "../config/db";
import { logger } from "../utils/logger";

export interface RiskFactors {
  missedMedsCount: number;
  totalMedsCount: number;
  missedTasksCount: number;
  totalTasksCount: number;
  sadMoodCount: number;
  sosCount: number;
  totalLoggedActivities: number; // FIX #24: tracks inactivity
  isInactive: boolean;          // FIX #24: true if elder has zero logs in 7 days
}

export interface RiskProfile {
  score: number; // 0 - 100
  category: "Low" | "Medium" | "High";
  factors: RiskFactors;
  recommendations: string[];
}

/**
 * calculateRiskProfile
 * ─────────────────────────────────────────────────────────────────────────────
 * Calculates the risk profile score for an elder based on their activity
 * over the last 7 days.
 *
 * FIX #14: Results are now persisted to the `risk_profiles` table.
 * FIX #24: Inactivity detection added — zero logs in 7 days is now classified
 *          as HIGH risk, not Low risk (zero negative logs ≠ healthy elder).
 *
 * @param elderId - The database ID of the elder
 * @param persist - Whether to persist the result to risk_profiles table (default: true)
 */
export const calculateRiskProfile = async (
  elderId: number,
  persist = true
): Promise<RiskProfile> => {
  try {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    // 1. Fetch Medications & Logs (Missed Medications)
    const medsRes = await pool.query(
      "SELECT COUNT(*) FROM medications WHERE elder_id = $1",
      [elderId]
    );
    const activeMedsCount = parseInt(medsRes.rows[0].count, 10);
    const totalScheduledMeds = activeMedsCount * 7;

    const medLogsRes = await pool.query(
      `SELECT COUNT(*) FROM medication_logs 
       WHERE elder_id = $1 
         AND taken_status = TRUE 
         AND logged_date >= $2`,
      [elderId, last7Days]
    );
    const takenMedsCount = parseInt(medLogsRes.rows[0].count, 10);
    const missedMedsCount = Math.max(0, totalScheduledMeds - takenMedsCount);

    let medScore = 0;
    if (totalScheduledMeds > 0) {
      const missedRatio = missedMedsCount / totalScheduledMeds;
      medScore = Math.round(missedRatio * 40); // Weight: 40%
    }

    // 2. Fetch Tasks & Logs (Missed Tasks)
    const tasksRes = await pool.query(
      `SELECT COUNT(*) FROM daily_tasks WHERE elder_id = $1`,
      [elderId]
    );
    const activeTasksCount = parseInt(tasksRes.rows[0].count, 10);
    const totalScheduledTasks = activeTasksCount * 7;

    const taskLogsRes = await pool.query(
      `SELECT COUNT(*) FROM task_logs 
       WHERE elder_id = $1 
         AND completed = TRUE 
         AND logged_date >= $2`,
      [elderId, last7Days]
    );
    const completedTasksCount = parseInt(taskLogsRes.rows[0].count, 10);
    const missedTasksCount = Math.max(0, totalScheduledTasks - completedTasksCount);

    let taskScore = 0;
    if (totalScheduledTasks > 0) {
      const missedRatio = missedTasksCount / totalScheduledTasks;
      taskScore = Math.round(missedRatio * 25); // Weight: 25%
    }

    // 3. Fetch Mood Logs (Sad/Angry/Anxious)
    const moodRes = await pool.query(
      `SELECT mood_type FROM mood_logs 
       WHERE elder_id = $1 
         AND created_at >= $2`,
      [elderId, last7Days]
    );
    const moodLogs = moodRes.rows;
    const sadMoodCount = moodLogs.filter((m) =>
      ["Sad", "Angry", "Anxious"].includes(m.mood_type)
    ).length;

    // Weight: 20% (each negative mood log adds 4 points, capped at 20)
    const moodScore = Math.min(20, sadMoodCount * 4);

    // 4. Fetch Emergency SOS Triggers
    const sosRes = await pool.query(
      `SELECT COUNT(*) FROM emergency_logs 
       WHERE elder_id = $1 
         AND created_at >= $2`,
      [elderId, last7Days]
    );
    const sosCount = parseInt(sosRes.rows[0].count, 10);

    // Weight: 15% (each SOS event adds 15 points, capped at 15)
    const sosScore = Math.min(15, sosCount * 15);

    // ─── FIX #24: Inactivity Detection ────────────────────────────────────────
    // Previously: zero negative logs → score = 0 → "Low Risk" (misclassification).
    // An elder who has stopped logging anything at all is at HIGH risk.
    // We count total activity in the last 7 days (med logs + task logs + mood logs).
    const totalLoggedActivities = takenMedsCount + completedTasksCount + moodLogs.length;
    const isInactive = totalLoggedActivities === 0 && (activeMedsCount > 0 || activeTasksCount > 0);

    // Total Score calculation
    let totalScore = Math.min(100, medScore + taskScore + moodScore + sosScore);

    // Inactivity penalty: if elder has scheduled items but zero logs → escalate to High
    let inactivityPenalty = 0;
    if (isInactive) {
      inactivityPenalty = 50; // Forces score into "High" category minimum
      totalScore = Math.min(100, totalScore + inactivityPenalty);
    }

    // Risk category classification
    let category: "Low" | "Medium" | "High" = "Low";
    const recommendations: string[] = [];

    if (totalScore >= 70) {
      category = "High";
      recommendations.push("Immediate health check recommended.");
      recommendations.push("Contact elder immediately or dispatch assistance.");
      recommendations.push("Review medication schedule accuracy with a doctor.");
      if (isInactive) {
        recommendations.push("⚠️ Elder has shown NO activity in 7 days. Urgent welfare check needed.");
      }
    } else if (totalScore >= 35) {
      category = "Medium";
      recommendations.push("Review elder's daily routine and compliance.");
      recommendations.push("Call to check on mood fluctuations.");
      recommendations.push("Ensure emergency contacts are up to date.");
    } else {
      category = "Low";
      recommendations.push("Keep up the good monitoring routine!");
      recommendations.push("Encourage continued task completion.");
    }

    const profile: RiskProfile = {
      score: totalScore,
      category,
      factors: {
        missedMedsCount,
        totalMedsCount: totalScheduledMeds,
        missedTasksCount,
        totalTasksCount: totalScheduledTasks,
        sadMoodCount,
        sosCount,
        totalLoggedActivities,
        isInactive,
      },
      recommendations,
    };

    // ─── FIX #14: Persist to risk_profiles table ──────────────────────────────
    // Previously risk scores were computed and discarded. Now persisted so
    // historical trends can be queried and displayed to guardians.
    if (persist) {
      try {
        await pool.query(
          `INSERT INTO risk_profiles (elder_id, score, category, factors, calculated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (elder_id)
           DO UPDATE SET
             score = EXCLUDED.score,
             category = EXCLUDED.category,
             factors = EXCLUDED.factors,
             calculated_at = NOW()`,
          [
            elderId,
            profile.score,
            profile.category,
            JSON.stringify(profile.factors),
          ]
        );
      } catch (persistErr) {
        // Persistence failure is non-fatal — log and continue returning the profile
        logger.error(`[RiskEngine] Failed to persist risk profile for elder ${elderId}:`, persistErr);
      }
    }

    return profile;
  } catch (error) {
    logger.error("calculateRiskProfile Error:", error);
    throw error;
  }
};
