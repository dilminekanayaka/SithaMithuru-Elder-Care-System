import pool from "../config/db";
import { Queryable } from "../config/transaction";

export interface EmergencyInput {
  elder_id: string | number;
  device_location?: string | null;
  triggered_phrase?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  maps_url?: string | null;
  triggered_by_model?: string | null;
  audio_snr_db?: number | null;
  confidence_score?: number | null;
}

export const findLinkedGuardianUserIds = async (elderId: string | number, db: Queryable = pool): Promise<{ elderName: string; guardianIds: number[] }> => {
  const result = await db.query(
    `SELECT u.name as elder_name, u.primary_guardian_id, ger.guardian_id as linked_guardian_id
     FROM users u
     LEFT JOIN guardian_elder_relationships ger ON ger.elder_id = u.id AND ger.status = 'ACTIVE'
     WHERE u.id = $1`,
    [elderId]
  );

  const elderName = result.rows[0]?.elder_name || "Your Elder";
  const set = new Set<number>();
  result.rows.forEach((row) => {
    if (row.primary_guardian_id) set.add(Number(row.primary_guardian_id));
    if (row.linked_guardian_id) set.add(Number(row.linked_guardian_id));
  });

  return { elderName, guardianIds: Array.from(set) };
};

export const findGuardianFcmTokens = async (guardianIds: number[], db: Queryable = pool) => {
  if (guardianIds.length === 0) return [];
  const result = await db.query(
    `SELECT id, fcm_token FROM users WHERE id = ANY($1) AND fcm_token IS NOT NULL`,
    [guardianIds]
  );
  return result.rows;
};

export const insertEmergencyLog = async (data: EmergencyInput, db: Queryable = pool) => {
  const formattedMapsUrl = data.maps_url || (data.latitude !== undefined && data.latitude !== null && data.longitude !== undefined && data.longitude !== null ? `https://maps.google.com/?q=${data.latitude},${data.longitude}` : null);

  const result = await db.query(
    `INSERT INTO emergency_logs (
       elder_id, device_location, triggered_phrase, latitude, longitude, maps_url,
       triggered_by_model, audio_snr_db, confidence_score, status, created_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending', CURRENT_TIMESTAMP)
     RETURNING id, elder_id, device_location, triggered_phrase, latitude, longitude, maps_url,
               triggered_by_model, audio_snr_db, confidence_score, status, created_at`,
    [
      data.elder_id,
      data.device_location || "Unknown Location",
      data.triggered_phrase || "SOS Button Pressed",
      data.latitude ?? null,
      data.longitude ?? null,
      formattedMapsUrl,
      data.triggered_by_model || null,
      data.audio_snr_db ?? null,
      data.confidence_score ?? null,
    ]
  );
  return result.rows[0];
};

export const findEmergencyLogById = async (id: string | number, db: Queryable = pool) => {
  const result = await db.query("SELECT * FROM emergency_logs WHERE id = $1", [id]);
  return result.rows[0];
};

export const resolveEmergencyLog = async (
  id: string | number,
  resolverId: string | number,
  status: "Resolved" | "False Alarm",
  reason: string,
  role: "Guardian" | "Elder",
  db: Queryable = pool
) => {
  const result = await db.query(
    `WITH updated AS (
       UPDATE emergency_logs
       SET status = $1,
           resolved_by = $2,
           resolved_at = CURRENT_TIMESTAMP,
           resolution_reason = $3,
           resolved_by_name = COALESCE((SELECT name FROM users WHERE id = $2), $5),
           cancelled_by_role = $5,
           resolution_notes = $3
       WHERE id = $4
       RETURNING *
     )
     SELECT u.id, u.elder_id, u.device_location, u.latitude, u.longitude, u.maps_url,
            u.triggered_phrase, u.status, u.resolution_reason, u.resolved_by_name,
            u.cancelled_by_role, u.resolution_notes,
            u.created_at, u.resolved_at
     FROM updated u`,
    [status, resolverId, reason, id, role]
  );
  return result.rows[0];
};

export const findEmergencyAlertsForGuardian = async (guardianId: string | number, elderIdFilter?: string | number, db: Queryable = pool) => {
  let query = `
    SELECT el.id, el.elder_id, u.name as elder_name, u.phone_number as elder_phone,
           el.device_location, el.triggered_phrase, el.latitude, el.longitude, el.maps_url,
           el.status, el.resolution_reason, el.resolution_notes, el.cancelled_by_role,
           el.created_at, el.resolved_at, resolver.name as resolved_by_name
    FROM emergency_logs el
    JOIN users u ON u.id = el.elder_id
    JOIN guardian_elder_relationships ge ON ge.elder_id = u.id
    LEFT JOIN users resolver ON resolver.id = el.resolved_by
    WHERE ge.guardian_id = $1 AND ge.status = 'ACTIVE'
  `;
  const params: any[] = [guardianId];

  if (elderIdFilter) {
    query += ` AND el.elder_id = $2`;
    params.push(elderIdFilter);
  }

  query += ` ORDER BY el.created_at DESC LIMIT 50`;

  const result = await db.query(query, params);
  return result.rows;
};

export const findEmergencyLogsByElder = async (elderId: string | number, limit: number = 50, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT el.id, el.elder_id, u.name as elder_name, u.phone_number as elder_phone,
            el.device_location, el.triggered_phrase, el.latitude, el.longitude, el.maps_url,
            el.status, el.resolution_reason, el.resolution_notes, el.cancelled_by_role,
            el.created_at, el.resolved_at, resolver.name as resolved_by_name
     FROM emergency_logs el
     JOIN users u ON u.id = el.elder_id
     LEFT JOIN users resolver ON resolver.id = el.resolved_by
     WHERE el.elder_id = $1
     ORDER BY el.created_at DESC
     LIMIT $2`,
    [elderId, limit]
  );
  return result.rows;
};
