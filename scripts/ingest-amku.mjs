/**
 * Imports AMKU (Antimonopoly Committee) tender-violation decisions from data.gov.ua.
 * Dataset: consolidated decisions on competition distortion in tenders (with EDRPOU).
 * Usage: node scripts/ingest-amku.mjs
 */
import { DatabaseSync } from "node:sqlite";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const DATASET_ID = "1b98d102-0b52-44ba-882f-5f6a559ff81c";
const API = "https://data.gov.ua/api/3/action";
const SOURCE = "amku";
const SOURCE_URL = `https://data.gov.ua/dataset/${DATASET_ID}`;
const UA = "Vidkryto/1.0 (+https://github.com/Flumos1/Vidkryto)";
const DB_FILE = process.env.DB_FILE || path.join(process.cwd(), "data", "clarity.db");

const db = new DatabaseSync(DB_FILE);
db.exec(`
CREATE TABLE IF NOT EXISTS amku_violations (
  id TEXT PRIMARY KEY,
  edrpou TEXT NOT NULL,
  company_name TEXT,
  decision_number TEXT,
  decision_date TEXT,
  body TEXT,
  court_case TEXT,
  court_name TEXT,
  court_date TEXT,
  court_decision TEXT,
  review_decision TEXT,
  notes TEXT,
  source_url TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_amku_edrpou ON amku_violations(edrpou);
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

const startedAt = new Date().toISOString();
const runId = db
  .prepare("INSERT INTO ingest_runs (source, started_at, status) VALUES (?, ?, 'running')")
  .run(SOURCE, startedAt).lastInsertRowid;

async function jsonAction(action, params) {
  const url = new URL(`${API}/${action}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`${action}: HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(`${action}: unsuccessful`);
  return data.result;
}

function excelDate(value) {
  if (typeof value === "number" && value > 1000) {
    const ms = Date.UTC(1899, 11, 30) + value * 86400000;
    return new Date(ms).toISOString().slice(0, 10);
  }
  const text = String(value ?? "").trim();
  return text && text !== "NA" ? text : null;
}

function normalizeEdrpou(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length === 8 || digits.length === 10 ? digits : "";
}

try {
  console.log(`[amku] package_show ${DATASET_ID}`);
  const pkg = await jsonAction("package_show", { id: DATASET_ID });
  const resource = [...pkg.resources]
    .filter((r) => r.url)
    .sort((a, b) => {
      const at = new Date(a.last_modified || a.created || 0).getTime();
      const bt = new Date(b.last_modified || b.created || 0).getTime();
      return bt - at;
    })[0];
  if (!resource) throw new Error("no resources");
  console.log(`[amku] ${resource.name}`);

  const fileRes = await fetch(resource.url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(90000),
  });
  if (!fileRes.ok) throw new Error(`download: HTTP ${fileRes.status}`);
  const buffer = Buffer.from(await fileRes.arrayBuffer());
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => String(cell).toUpperCase().includes("ЄДРПОУ")),
  );
  if (headerIndex < 0) throw new Error("header row not found");
  const headers = rows[headerIndex].map((cell) => String(cell).replace(/\s+/g, " ").trim());

  const col = (needle) =>
    headers.findIndex((h) => h.toLowerCase().includes(needle.toLowerCase()));
  const idx = {
    edrpou: col("ЄДРПОУ"),
    name: col("Суб'єкт господарювання"),
    decision: col("№ рішення у справі"),
    date: col("Дата рішення у справі"),
    body: col("Орган АМКУ"),
    courtCase: col("№ судової справи"),
    courtName: col("Назва суду"),
    courtDate: col("Дата рішення суду"),
    courtDecision: col("Зміст рішення суду"),
    review: col("№ рішення органу АМКУ за результатами"),
    notes: col("Примітки"),
  };
  if (idx.edrpou < 0 || idx.name < 0) throw new Error("required columns not found");

  const insert = db.prepare(`
    INSERT OR REPLACE INTO amku_violations
      (id, edrpou, company_name, decision_number, decision_date, body, court_case,
       court_name, court_date, court_decision, review_decision, notes, source_url, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  let imported = 0;
  let skipped = 0;

  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM amku_violations").run();
    for (let i = headerIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      const edrpou = normalizeEdrpou(row[idx.edrpou]);
      if (!edrpou) {
        skipped++;
        continue;
      }
      const decision = String(row[idx.decision] ?? "").trim();
      const company = String(row[idx.name] ?? "").trim();
      insert.run(
        `${decision || "no-decision"}:${edrpou}:${i}`,
        edrpou,
        company,
        decision || null,
        excelDate(row[idx.date]),
        String(row[idx.body] ?? "").trim() || null,
        String(row[idx.courtCase] ?? "").trim() || null,
        String(row[idx.courtName] ?? "").trim() || null,
        excelDate(row[idx.courtDate]),
        String(row[idx.courtDecision] ?? "").trim().slice(0, 1500) || null,
        String(row[idx.review] ?? "").trim() || null,
        String(row[idx.notes] ?? "").trim().slice(0, 500) || null,
        SOURCE_URL,
        now,
      );
      imported++;
    }
    db.exec("COMMIT");

    db.prepare(
      "UPDATE ingest_runs SET finished_at = ?, status = 'success', rows = ? WHERE id = ?",
    ).run(new Date().toISOString(), imported, runId);
    db.prepare(
      "INSERT INTO sync_state (key, value) VALUES ('amku_updated', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    ).run(now);
    db.prepare(
      "INSERT INTO sync_state (key, value) VALUES ('amku_count', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    ).run(String(imported));

    const stats = db
      .prepare("SELECT COUNT(*) AS rows, COUNT(DISTINCT edrpou) AS companies FROM amku_violations")
      .get();
    console.log("[amku] imported:", stats, "skipped:", skipped);
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
} catch (err) {
  db.prepare(
    "UPDATE ingest_runs SET finished_at = ?, status = 'failed', message = ? WHERE id = ?",
  ).run(new Date().toISOString(), String(err).slice(0, 500), runId);
  console.error("[amku] failed:", err);
  process.exitCode = 1;
} finally {
  db.close();
}
