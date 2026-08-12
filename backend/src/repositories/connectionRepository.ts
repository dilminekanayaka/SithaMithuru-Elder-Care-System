import pool from "../config/db";
import { Queryable } from "../config/transaction";

// ─── guardian_elder_relationships ──────────────────────────────────────────

export const findActiveRelationship = async (guardianId: string | number, elderId: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT status FROM guardian_elder_relationships WHERE guardian_id = $1 AND elder_id = $2 AND status = 'ACTIVE'`,
    [guardianId, elderId]
  );
  return result.rows[0];
};

/**
 * Canonical "create or reactivate a guardian-elder link" write. Reactivating
 * on conflict (rather than DO NOTHING) matters: a previously-unlinked pair
 * that reconnects must actually become ACTIVE again, not silently no-op.
 */
export const upsertActiveRelationship = async (
  guardianId: string | number,
  elderId: string | number,
  relationshipType: string,
  permissionLevel: string,
  db: Queryable = pool
) => {
  await db.query(
    `INSERT INTO guardian_elder_relationships (guardian_id, elder_id, relationship_type, permission_level, status, connected_at)
     VALUES ($1, $2, $3, $4, 'ACTIVE', CURRENT_TIMESTAMP)
     ON CONFLICT (guardian_id, elder_id) DO UPDATE SET status = 'ACTIVE'`,
    [guardianId, elderId, relationshipType, permissionLevel]
  );
};

export const setPrimaryGuardian = async (elderId: string | number, guardianId: string | number, db: Queryable = pool) => {
  await db.query("UPDATE users SET primary_guardian_id = $1 WHERE id = $2", [guardianId, elderId]);
};

export const deactivateRelationship = async (guardianId: string | number, elderId: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `UPDATE guardian_elder_relationships SET status = 'INACTIVE'
     WHERE guardian_id = $1 AND elder_id = $2 AND status = 'ACTIVE' RETURNING *`,
    [guardianId, elderId]
  );
  return result.rows[0];
};

export const findGuardiansForElder = async (elderId: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT u.id, u.name, u.email, u.phone_number as phone, ger.relationship_type as relation
     FROM guardian_elder_relationships ger
     JOIN users u ON u.id = ger.guardian_id
     WHERE ger.elder_id = $1 AND ger.status = 'ACTIVE'
     ORDER BY ger.connected_at DESC`,
    [elderId]
  );
  return result.rows;
};

export const findEldersForGuardian = async (guardianId: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT u.id, u.name, u.email, u.age, u.blood_type, u.weight, u.phone_number, u.avatar_url,
            ge.status as link_status
     FROM users u
     JOIN guardian_elder_relationships ge ON ge.elder_id = u.id
     WHERE ge.guardian_id = $1 AND ge.status = 'ACTIVE'
     ORDER BY u.name ASC`,
    [guardianId]
  );
  return result.rows;
};

// ─── invitations (email/token-based invite: ConnectScreen flow) ───────────

export const countRecentInvitesByUser = async (userId: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT COUNT(*) FROM invitations WHERE created_by = $1 AND created_at >= NOW() - INTERVAL '24 hours'`,
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
};

export const insertInvitation = async (
  token: string,
  createdBy: string | number,
  role: string,
  expiresAt: Date,
  db: Queryable = pool
) => {
  const result = await db.query(
    `INSERT INTO invitations (token, created_by, role, expires_at) VALUES ($1, $2, $3, $4) RETURNING id, token, expires_at`,
    [token, createdBy, role, expiresAt]
  );
  return result.rows[0];
};

export const findInvitationByToken = async (token: string, db: Queryable = pool) => {
  const result = await db.query(`SELECT * FROM invitations WHERE token = $1`, [token]);
  return result.rows[0];
};

export const markInvitationUsed = async (id: string | number, db: Queryable = pool) => {
  await db.query(`UPDATE invitations SET used = TRUE, status = 'ACCEPTED' WHERE id = $1`, [id]);
};

// ─── pending_connections (shared by both the invite-token flow and the
// Elder-initiated email link-request flow) ─────────────────────────────────

export const findPendingConnectionBetween = async (fromUser: string | number, toUser: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT id FROM pending_connections WHERE from_user = $1 AND to_user = $2 AND status = 'PENDING'`,
    [fromUser, toUser]
  );
  return result.rows[0];
};

export const insertPendingConnection = async (
  fromUser: string | number,
  toUser: string | number,
  relationshipType: string,
  permissionLevel: string,
  db: Queryable = pool
) => {
  await db.query(
    `INSERT INTO pending_connections (from_user, to_user, relationship_type, permission_level) VALUES ($1, $2, $3, $4)`,
    [fromUser, toUser, relationshipType, permissionLevel]
  );
};

// Incoming requests addressed TO `toUser` — used both for the generic invite
// flow (connectionController) and the Elder-initiated link-request flow
// (guardianController) which previously each ran their own slightly
// different (one of them actually broken — selected a nonexistent `u.phone`
// column) copy of this same query.
export const findIncomingPendingConnections = async (toUser: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT pc.id, u.id as user_id, u.name, u.email, u.age, u.phone_number, u.avatar_url,
            pc.relationship_type, pc.permission_level, pc.created_at
     FROM pending_connections pc
     JOIN users u ON pc.from_user = u.id
     WHERE pc.to_user = $1 AND pc.status = 'PENDING'
     ORDER BY pc.created_at DESC`,
    [toUser]
  );
  return result.rows;
};

export const findPendingConnectionById = async (id: string | number, toUser: string | number, db: Queryable = pool) => {
  const result = await db.query(`SELECT * FROM pending_connections WHERE id = $1 AND to_user = $2`, [id, toUser]);
  return result.rows[0];
};

export const findPendingConnectionByParticipants = async (
  fromUser: string | number,
  toUser: string | number,
  db: Queryable = pool
) => {
  const result = await db.query(
    `SELECT * FROM pending_connections WHERE from_user = $1 AND to_user = $2 AND status = 'PENDING'`,
    [fromUser, toUser]
  );
  return result.rows[0];
};

export const updatePendingConnectionStatus = async (id: string | number, status: "ACCEPTED" | "REJECTED", db: Queryable = pool) => {
  await db.query(`UPDATE pending_connections SET status = $1 WHERE id = $2`, [status, id]);
};

// ─── elder_invitations (QR/6-char-code-based invite: AddElderScreen flow) ─

export const insertElderInvitation = async (
  guardianId: string | number,
  code: string,
  expiresAt: Date,
  db: Queryable = pool
) => {
  await db.query(
    `INSERT INTO elder_invitations (guardian_id, invite_code, expires_at, status) VALUES ($1, $2, $3, 'PENDING')`,
    [guardianId, code, expiresAt]
  );
};

export const findValidElderInvitation = async (code: string, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT * FROM elder_invitations WHERE UPPER(invite_code) = UPPER($1) AND expires_at > NOW() AND status = 'PENDING'`,
    [code.trim()]
  );
  return result.rows[0];
};

export const markElderInvitationAccepted = async (id: string | number, db: Queryable = pool) => {
  await db.query(`UPDATE elder_invitations SET status = 'ACCEPTED' WHERE id = $1`, [id]);
};

// ─── connection_logs ────────────────────────────────────────────────────────

export const insertConnectionLog = async (userId: string | number, action: string, details: string, db: Queryable = pool) => {
  await db.query("INSERT INTO connection_logs (user_id, action, details) VALUES ($1, $2, $3)", [userId, action, details]);
};
