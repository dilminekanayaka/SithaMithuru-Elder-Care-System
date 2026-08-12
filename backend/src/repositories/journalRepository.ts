import pool from "../config/db";
import { Queryable } from "../config/transaction";

export interface JournalInput {
  elder_id: string | number;
  title: string;
  content: string;
  mood_tag?: string | null;
  audio_url?: string | null;
}

export const findJournalEntriesByElder = async (
  elderId: string | number,
  limit: number = 20,
  offset: number = 0,
  db: Queryable = pool
) => {
  const result = await db.query(
    `SELECT id, title, content, mood_tag,
            TO_CHAR(created_at, 'Mon DD, YYYY') as date,
            created_at
     FROM journal_entries
     WHERE elder_id = $1 AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [elderId, limit, offset]
  );
  return result.rows;
};

export const countJournalEntriesByElder = async (elderId: string | number, db: Queryable = pool) => {
  const result = await db.query(
    "SELECT COUNT(*) as total FROM journal_entries WHERE elder_id = $1 AND deleted_at IS NULL",
    [elderId]
  );
  return parseInt(result.rows[0]?.total || "0", 10);
};

export const findJournalEntryElderId = async (id: string | number, db: Queryable = pool) => {
  const result = await db.query("SELECT elder_id FROM journal_entries WHERE id = $1 AND deleted_at IS NULL", [id]);
  return result.rows[0]?.elder_id as string | number | undefined;
};

export const createJournalEntry = async (data: JournalInput, db: Queryable = pool) => {
  const result = await db.query(
    `INSERT INTO journal_entries (elder_id, title, content, mood_tag, audio_url, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id, title, content, mood_tag, TO_CHAR(created_at, 'Mon DD, YYYY') as date, created_at`,
    [data.elder_id, data.title.trim(), data.content.trim(), data.mood_tag || null, data.audio_url || null]
  );
  return result.rows[0];
};

export const deleteJournalEntry = async (id: string | number, db: Queryable = pool) => {
  const result = await db.query("UPDATE journal_entries SET deleted_at = NOW() WHERE id = $1 RETURNING id", [id]);
  return result.rows[0];
};
