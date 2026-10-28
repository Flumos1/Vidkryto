import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const globalForDb = globalThis as unknown as { __vidkrytoDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (globalForDb.__vidkrytoDb) return globalForDb.__vidkrytoDb;
  const file = process.env.DB_FILE || path.join(process.cwd(), "data", "clarity.db");
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA synchronous = NORMAL;");
  globalForDb.__vidkrytoDb = db;
  return db;
}

export function hasData(): boolean {
  try {
    const row = getDb().prepare("SELECT COUNT(*) AS n FROM tenders").get() as { n: number };
    return row.n > 0;
  } catch {
    return false;
  }
}
