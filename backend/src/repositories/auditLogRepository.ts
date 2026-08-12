import pool from "../config/db";
import { Queryable } from "../config/transaction";
import { logger } from "../utils/logger";

interface AuditLogEntry {
  actorId: string | number;
  action: string;
  entityId: string | number;
  entityType: string;
  oldData?: any;
  newData?: any;
}

/**
 * Records an entry in the immutable audit_logs table. Deliberately swallows
 * its own failure — every call site in this codebase records an audit trail
 * for a mutation that has already been committed, so a broken/missing audit
 * table must never turn an already-successful operation into a reported
 * failure for the client (this was a real, previously-confirmed bug: see
 * migration_v13's header). Centralizing this here means that "audit logging
 * is best-effort, never fails the caller" is enforced in exactly one place
 * instead of re-implemented in every controller that writes to audit_logs.
 */
export const recordAuditLog = async (entry: AuditLogEntry, db: Queryable = pool): Promise<void> => {
  try {
    await db.query(
      `INSERT INTO audit_logs (actor_id, action, entity_id, entity_type, old_data, new_data)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        entry.actorId,
        entry.action,
        entry.entityId,
        entry.entityType,
        entry.oldData !== undefined ? JSON.stringify(entry.oldData) : null,
        entry.newData !== undefined ? JSON.stringify(entry.newData) : null,
      ]
    );
  } catch (err: any) {
    logger.warn(`[AuditLog] Failed to record ${entry.action} for ${entry.entityType} #${entry.entityId}: ${err.message}`);
  }
};
