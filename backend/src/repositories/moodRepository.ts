import pool from "../config/db";
import { Queryable } from "../config/transaction";

export interface MoodLogInput {
  elder_id: string | number;
  mood_type: string;
  notes?: string | null;
  created_at?: Date | string | null;
}

export const findMoodHistoryByElder = async (elderId: string | number, days: number = 7, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT id, mood_type, notes,
            TO_CHAR(created_at, 'YYYY-MM-DD') as date,
            TO_CHAR(created_at, 'Day') as day_name,
            created_at
     FROM mood_logs
     WHERE elder_id = $1
       AND created_at >= NOW() - INTERVAL '1 day' * $2
     ORDER BY created_at DESC`,
    [elderId, days]
  );
  return result.rows;
};

export const createMoodLog = async (data: MoodLogInput, db: Queryable = pool) => {
  const result = await db.query(
    `INSERT INTO mood_logs (elder_id, mood_type, notes, created_at)
     VALUES ($1, $2, $3, COALESCE($4, CURRENT_TIMESTAMP))
     RETURNING id, mood_type, notes, TO_CHAR(created_at, 'YYYY-MM-DD') as date, created_at`,
    [data.elder_id, data.mood_type, data.notes || null, data.created_at || null]
  );
  return result.rows[0];
};

export const countNegativeMoods = async (elderId: string | number, days: number = 7, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT COUNT(*) as count FROM mood_logs WHERE elder_id = $1 AND mood_type IN ('Sad', 'Anxious', 'Angry') AND created_at >= NOW() - INTERVAL '1 day' * $2`,
    [elderId, days]
  );
  return parseInt(result.rows[0]?.count || "0", 10);
};
