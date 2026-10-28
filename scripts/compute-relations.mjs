/**
 * Builds company-to-company relations from shared procurement participation.
 * Kinds: "co_bid" (both bid/supply) and "buyer_supplier" (customer relationship).
 *
 * Usage: node scripts/compute-relations.mjs
 */
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const DB_FILE = process.env.DB_FILE || path.join(process.cwd(), "data", "clarity.db");
const db = new DatabaseSync(DB_FILE);

db.exec(`
CREATE TABLE IF NOT EXISTS company_relations (
  a TEXT NOT NULL,
  b TEXT NOT NULL,
  kind TEXT NOT NULL,
  shared INTEGER NOT NULL DEFAULT 0,
  last_date TEXT,
  PRIMARY KEY (a, b, kind)
);
CREATE INDEX IF NOT EXISTS idx_relations_a ON company_relations(a);
CREATE INDEX IF NOT EXISTS idx_relations_b ON company_relations(b);
`);

const rows = db
  .prepare(
    `SELECT p.tender_id, p.edrpou, p.role, t.date_created, t.buyer_edrpou
     FROM participations p JOIN tenders t ON t.id = p.tender_id
     WHERE p.edrpou <> ''`,
  )
  .all();

const tenders = new Map();
for (const row of rows) {
  if (!tenders.has(row.tender_id)) tenders.set(row.tender_id, new Map());
  const participants = tenders.get(row.tender_id);
  const isBuyer = row.role === "buyer" || row.edrpou === row.buyer_edrpou;
  const existing = participants.get(row.edrpou);
  participants.set(row.edrpou, {
    isBuyer: Boolean(existing?.isBuyer || isBuyer),
    date: row.date_created,
  });
}

const relations = new Map();
function addPair(a, b, kind, date) {
  if (!a || !b || a === b) return;
  const [left, right] = a < b ? [a, b] : [b, a];
  const key = `${left}|${right}|${kind}`;
  const current = relations.get(key);
  if (current) {
    current.shared += 1;
    if ((date || "") > (current.last_date || "")) current.last_date = date;
  } else {
    relations.set(key, { a: left, b: right, kind, shared: 1, last_date: date || null });
  }
}

for (const [, participants] of tenders) {
  const list = [...participants.entries()].slice(0, 40);
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const [a, infoA] = list[i];
      const [b, infoB] = list[j];
      if (infoA.isBuyer && infoB.isBuyer) continue;
      const kind = infoA.isBuyer || infoB.isBuyer ? "buyer_supplier" : "co_bid";
      addPair(a, b, kind, infoA.date || infoB.date);
    }
  }
}

const insert = db.prepare(
  "INSERT OR REPLACE INTO company_relations (a, b, kind, shared, last_date) VALUES (?, ?, ?, ?, ?)",
);

db.exec("BEGIN");
try {
  db.exec("DELETE FROM company_relations");
  for (const relation of relations.values()) {
    insert.run(relation.a, relation.b, relation.kind, relation.shared, relation.last_date);
  }
  db.exec("COMMIT");
} catch (err) {
  db.exec("ROLLBACK");
  throw err;
}

db.prepare(
  "INSERT INTO sync_state (key, value) VALUES ('relations_updated', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
).run(new Date().toISOString());

const stats = db
  .prepare("SELECT kind, COUNT(*) AS n FROM company_relations GROUP BY kind")
  .all();
console.log(`[relations] tenders=${tenders.size} pairs=${relations.size}`, stats);
db.close();
