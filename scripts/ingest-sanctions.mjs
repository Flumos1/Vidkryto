/**
 * Imports the state sanctions / terrorist list from data.gov.ua (CKAN).
 *
 * Flow: package_show -> latest resource (XLSX index) -> XML link -> parse -> SQLite.
 * Usage: node scripts/ingest-sanctions.mjs
 */
import { DatabaseSync } from "node:sqlite";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const LEGAL_FORMS = new Set([
  "тов",
  "пат",
  "прат",
  "дп",
  "кп",
  "кпп",
  "фоп",
  "пп",
  "ат",
  "llc",
  "ltd",
  "limited",
  "inc",
  "corp",
  "corporation",
  "company",
  "co",
  "plc",
  "gmbh",
  "ag",
  "sa",
  "bv",
]);

function normalizeEntityName(raw) {
  const base = String(raw || "")
    .toLowerCase()
    .replace(/[’'`«»"“”„]/g, " ")
    .replace(/[^a-zа-яіїєґ0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = base.split(" ").filter(Boolean);
  const filtered = tokens.filter((t) => !LEGAL_FORMS.has(t));
  return (filtered.length >= 2 ? filtered : tokens).join(" ");
}

function decodeXml(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}

const DATASET_ID = "30442100-2b7a-4d69-8816-8e3dd5da2492";
const API = "https://data.gov.ua/api/3/action";
const SOURCE = "fiu";
const SOURCE_URL = `https://data.gov.ua/dataset/${DATASET_ID}`;
const UA = "Vidkryto/1.0 (+https://github.com/Flumos1/Vidkryto)";

const DB_FILE = process.env.DB_FILE || path.join(process.cwd(), "data", "clarity.db");
mkdirSync(path.dirname(DB_FILE), { recursive: true });
const db = new DatabaseSync(DB_FILE);

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

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? decodeXml(m[1]) : "";
}

function extractNames(block) {
  const lists = [...block.matchAll(/<aka-list>([\s\S]*?)<\/aka-list>/g)].map((m) => m[1]);
  let primary = "";
  for (const list of lists) {
    if (tag(list, "type-aka") === "N") {
      primary = ["aka-name1", "aka-name2", "aka-name3", "aka-name4"]
        .map((n) => tag(list, n))
        .filter(Boolean)
        .join(" ");
      break;
    }
  }
  if (!primary && lists[0]) primary = tag(lists[0], "aka-name1");

  const aliases = [];
  for (const list of lists) {
    const name = ["aka-name1", "aka-name2", "aka-name3", "aka-name4"]
      .map((n) => tag(list, n))
      .filter(Boolean)
      .join(" ");
    if (name && name !== primary && !aliases.includes(name)) aliases.push(name);
  }
  return { primary: primary.trim(), aliases };
}

function isoDate(raw) {
  if (!/^\d{8}$/.test(raw)) return null;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

try {
  console.log(`[sanctions] package_show ${DATASET_ID}`);
  const pkg = await jsonAction("package_show", { id: DATASET_ID });
  const resources = [...pkg.resources].sort((a, b) => {
    const at = new Date(a.last_modified || a.created || 0).getTime();
    const bt = new Date(b.last_modified || b.created || 0).getTime();
    return bt - at;
  });
  const resource = resources[0];
  if (!resource) throw new Error("no resources in dataset");
  console.log(`[sanctions] latest resource: ${resource.name} (${resource.format})`);

  const fileRes = await fetch(resource.url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(60000),
  });
  if (!fileRes.ok) throw new Error(`resource download: HTTP ${fileRes.status}`);
  const buffer = Buffer.from(await fileRes.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  let xmlUrl = "";
  for (const row of rows) {
    for (const cell of row) {
      const value = String(cell || "");
      if (/^https?:\/\/.+\.xml$/i.test(value)) {
        xmlUrl = value;
        break;
      }
    }
    if (xmlUrl) break;
  }
  if (!xmlUrl) throw new Error("XML resource link not found in index file");
  console.log(`[sanctions] xml: ${xmlUrl}`);

  const xmlRes = await fetch(xmlUrl, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(90000),
  });
  if (!xmlRes.ok) throw new Error(`xml download: HTTP ${xmlRes.status}`);
  const xml = await xmlRes.text();

  const blocks = [...xml.matchAll(/<acount-list>([\s\S]*?)<\/acount-list>/g)].map((m) => m[1]);
  if (blocks.length === 0) throw new Error("no records parsed from XML");
  console.log(`[sanctions] records: ${blocks.length}`);

  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO sanctions
      (id, source, entity_type, name, normalized_name, aliases_json, program, country,
       dob, address, comments, listed_at, source_url, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM sanctions WHERE source = ?").run(SOURCE);
    let inserted = 0;
    for (const block of blocks) {
      const number = tag(block, "number-entry");
      const { primary, aliases } = extractNames(block);
      if (!number || !primary) continue;
      const type = tag(block, "type-entry") === "1" ? "organization" : "person";
      const addressList = block.match(/<address-list>([\s\S]*?)<\/address-list>/);
      const address = addressList
        ? [...addressList[1].matchAll(/<address>([\s\S]*?)<\/address>/g)]
            .map((m) => decodeXml(m[1]))
            .join("; ")
        : "";

      insert.run(
        `${SOURCE}:${number}`,
        SOURCE,
        type,
        primary,
        normalizeEntityName(primary),
        JSON.stringify(aliases),
        tag(block, "program-entry"),
        tag(block, "nationality-list") || tag(block, "country"),
        tag(block, "date-of-birth-list"),
        address,
        tag(block, "comments").slice(0, 2000),
        isoDate(tag(block, "date-entry")),
        xmlUrl,
        now,
      );
      inserted++;
    }
    db.exec("COMMIT");

    db.prepare(
      "UPDATE ingest_runs SET finished_at = ?, status = 'success', rows = ? WHERE id = ?",
    ).run(new Date().toISOString(), inserted, runId);
    db.prepare(
      "INSERT INTO sync_state (key, value) VALUES ('sanctions_updated', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    ).run(now);
    db.prepare(
      "INSERT INTO sync_state (key, value) VALUES ('sanctions_count', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    ).run(String(inserted));

    const stats = db
      .prepare("SELECT entity_type, COUNT(*) AS n FROM sanctions GROUP BY entity_type")
      .all();
    console.log("[sanctions] imported:", stats);
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
} catch (err) {
  db.prepare(
    "UPDATE ingest_runs SET finished_at = ?, status = 'failed', message = ? WHERE id = ?",
  ).run(new Date().toISOString(), String(err).slice(0, 500), runId);
  console.error("[sanctions] failed:", err);
  process.exitCode = 1;
} finally {
  db.close();
}
