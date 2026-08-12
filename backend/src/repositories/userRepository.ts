import pool from "../config/db";
import { Queryable } from "../config/transaction";

const PROFILE_FIELDS = `u.id, u.name, u.email, u.role, u.avatar_url, u.age, u.blood_type, u.weight, u.phone_number, u.primary_guardian_id`;

export const findUserProfileById = async (id: string, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT ${PROFILE_FIELDS}, pg.name as guardian_name, pg.role as guardian_role
     FROM users u
     LEFT JOIN users pg ON u.primary_guardian_id = pg.id
     WHERE u.id = $1 AND u.deleted_at IS NULL`,
    [id]
  );
  return result.rows[0];
};

export interface ProfileUpdateFields {
  name?: string;
  age?: number | null;
  blood_type?: string | null;
  weight?: number | null;
  phone_number?: string | null;
  avatar_url?: string | null;
}

export const updateUserProfile = async (id: string, fields: ProfileUpdateFields, db: Queryable = pool) => {
  const result = await db.query(
    `UPDATE users
     SET name = $1, age = $2, blood_type = $3, weight = $4, phone_number = $5, avatar_url = $6, updated_at = CURRENT_TIMESTAMP
     WHERE id = $7 AND deleted_at IS NULL
     RETURNING id`,
    [fields.name, fields.age ?? null, fields.blood_type ?? null, fields.weight ?? null, fields.phone_number ?? null, fields.avatar_url ?? null, id]
  );
  return result.rows[0];
};

export const findAllGuardianNames = async (db: Queryable = pool) => {
  const result = await db.query("SELECT id, name FROM users WHERE role = 'Guardian' AND deleted_at IS NULL");
  return result.rows;
};

export const setFcmToken = async (userId: string, fcmToken: string, db: Queryable = pool) => {
  const result = await db.query(
    `UPDATE users SET fcm_token = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND deleted_at IS NULL RETURNING id`,
    [fcmToken, userId]
  );
  return result.rows[0];
};

export const softDeleteUser = async (id: string, db: Queryable = pool) => {
  const result = await db.query(
    `UPDATE users
     SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, fcm_token = NULL
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    [id]
  );
  return result.rows[0];
};

export const deleteRefreshTokensForUser = async (userId: string, db: Queryable = pool) => {
  await db.query("DELETE FROM refresh_tokens WHERE user_id = $1", [userId]);
};
