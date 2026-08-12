import { PoolClient } from "pg";
import pool from "./db";

// Any repository function that wants to be usable both standalone (auto-
// commit per statement) and inside a withTransaction() block accepts this
// type instead of the concrete Pool — both `pool` and a `PoolClient` expose
// the same `.query()` signature.
export type Queryable = Pick<PoolClient, "query">;

/**
 * Runs `work` against a single checked-out client wrapped in BEGIN/COMMIT,
 * rolling back on any thrown error. Use for any operation that performs more
 * than one write that must succeed or fail together (e.g. creating a
 * guardian-elder relationship + updating pending_connections status +
 * updating users.primary_guardian_id in the same request).
 */
export const withTransaction = async <T>(
  work: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
