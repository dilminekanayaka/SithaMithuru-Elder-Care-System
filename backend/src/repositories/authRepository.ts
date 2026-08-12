import pool from "../config/db";
import { Queryable } from "../config/transaction";

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: string;
}

export const findUserByEmail = async (email: string, db: Queryable = pool) => {
  const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0] as UserRow | undefined;
};

export const createUser = async (
  data: { name: string; email: string; passwordHash: string; role: string },
  db: Queryable = pool
) => {
  const result = await db.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at",
    [data.name, data.email, data.passwordHash, data.role]
  );
  return result.rows[0];
};

export const insertRefreshToken = async (
  data: { userId: number | string; token: string; deviceId: string; expiresAt: Date },
  db: Queryable = pool
) => {
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token, device_id, expires_at) VALUES ($1, $2, $3, $4)`,
    [data.userId, data.token, data.deviceId, data.expiresAt]
  );
};

export const upsertUserDevice = async (
  data: { userId: number | string; deviceId: string; deviceName: string; androidVersion: string },
  db: Queryable = pool
) => {
  await db.query(
    `INSERT INTO user_devices (user_id, device_id, device_name, android_version, last_login)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id, device_id)
     DO UPDATE SET last_login = NOW(), device_name = $3, android_version = $4`,
    [data.userId, data.deviceId, data.deviceName, data.androidVersion]
  );
};

export const deleteRefreshTokenByToken = async (token: string, db: Queryable = pool) => {
  await db.query("DELETE FROM refresh_tokens WHERE token = $1", [token]);
};

export const findRefreshTokenWithRole = async (token: string, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT rt.*, u.role FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id WHERE rt.token = $1`,
    [token]
  );
  return result.rows[0];
};

export const deleteRefreshTokenById = async (id: number | string, db: Queryable = pool) => {
  await db.query("DELETE FROM refresh_tokens WHERE id = $1", [id]);
};

export const rotateRefreshToken = async (
  id: number | string,
  newToken: string,
  newExpiresAt: Date,
  db: Queryable = pool
) => {
  await db.query(`UPDATE refresh_tokens SET token = $1, expires_at = $2 WHERE id = $3`, [
    newToken,
    newExpiresAt,
    id,
  ]);
};

export const setResetToken = async (
  userId: number | string,
  code: string,
  expires: Date,
  db: Queryable = pool
) => {
  await db.query(`UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3`, [
    code,
    expires,
    userId,
  ]);
};

export const findUserForPasswordReset = async (email: string, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT id, name, reset_token, reset_token_expires FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0];
};

export const clearResetTokenAndSetPassword = async (
  userId: number | string,
  passwordHash: string,
  db: Queryable = pool
) => {
  await db.query(
    `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2`,
    [passwordHash, userId]
  );
};
