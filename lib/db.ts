import { DatabaseSync } from "node:sqlite";
import { chmodSync, copyFileSync, existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const globalForDb = globalThis as unknown as { __vidkrytoDb?: DatabaseSync };

function open(file: string): DatabaseSync {
  const db = new DatabaseSync(file);
  db.exec("PRAGMA busy_timeout = 5000;");
  try {
    db.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;");
  } catch {
    // Read-only filesystem: WAL is optional, the database still opens.
  }
  return db;
}

function probeWrite(db: DatabaseSync): void {
  db.exec("CREATE TABLE IF NOT EXISTS _vidkryto_probe (x INTEGER); DROP TABLE IF EXISTS _vidkryto_probe;");
}

function ensureOptionalSchema(db: DatabaseSync): void {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS sanctions (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        name TEXT NOT NULL,
        normalized_name TEXT NOT NULL,
        aliases_json TEXT,
        program TEXT,
        country TEXT,
        dob TEXT,
        address TEXT,
        comments TEXT,
        listed_at TEXT,
        source_url TEXT,
        updated_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_sanctions_norm ON sanctions(normalized_name);
      CREATE INDEX IF NOT EXISTS idx_sanctions_type ON sanctions(entity_type);
      CREATE TABLE IF NOT EXISTS ingest_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        status TEXT NOT NULL,
        rows INTEGER DEFAULT 0,
        message TEXT
      );
    `);
  } catch {
    // Read-only database without a writable copy: queries degrade gracefully.
  }
}

function prepareWritableCopy(source: string): string {
  const target = path.join(tmpdir(), "vidkryto-clarity.db");
  if (!existsSync(target) || statSync(target).size !== statSync(source).size) {
    copyFileSync(source, target);
  }
  try {
    chmodSync(target, 0o600);
  } catch {
    // Best effort; some runtimes ignore chmod.
  }
  return target;
}

/**
 * Opens the local SQLite snapshot.
 *
 * Serverless platforms mount the deployment read-only. A writable copy is made
 * in the temp directory so that auth, saved searches and sync keep working for
 * the lifetime of the function instance.
 */
export function getDb(): DatabaseSync {
  if (globalForDb.__vidkrytoDb) return globalForDb.__vidkrytoDb;
  const file = process.env.DB_FILE || path.join(process.cwd(), "data", "clarity.db");
  const serverless = Boolean(
    process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL,
  );

  let db: DatabaseSync;
  if (serverless) {
    db = open(prepareWritableCopy(file));
  } else {
    try {
      db = open(file);
      probeWrite(db);
    } catch {
      db = open(prepareWritableCopy(file));
    }
  }

  globalForDb.__vidkrytoDb = db;
  ensureOptionalSchema(db);
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
