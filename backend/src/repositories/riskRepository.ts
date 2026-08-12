import pool from "../config/db";
import { Queryable } from "../config/transaction";
import { RiskProfile } from "../services/riskEngine";

export const upsertRiskProfile = async (elderId: string | number, profile: RiskProfile, db: Queryable = pool) => {
  await db.query(
    `INSERT INTO risk_profiles (elder_id, score, category, factors, calculated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (elder_id)
     DO UPDATE SET
       score = EXCLUDED.score,
       category = EXCLUDED.category,
       factors = EXCLUDED.factors,
       calculated_at = NOW()`,
    [elderId, profile.score, profile.category, JSON.stringify(profile.factors)]
  );
};

export const findLatestRiskProfile = async (elderId: string | number, db: Queryable = pool) => {
  const result = await db.query("SELECT * FROM risk_profiles WHERE elder_id = $1", [elderId]);
  return result.rows[0];
};
