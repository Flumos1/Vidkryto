import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("data/clarity.db");

const clean = (v) => String(v ?? "").replace(/[\u00A0\u2007\u202F]/g, " ").trim();

const tenders = db.prepare("SELECT id, buyer_edrpou, winner_edrpou, buyer_name FROM tenders").all();
const updateTender = db.prepare("UPDATE tenders SET buyer_edrpou = ?, winner_edrpou = ?, buyer_name = ? WHERE id = ?");

const parts = db.prepare("SELECT tender_id, edrpou, name, role, amount, status, date FROM participations").all();
const map = new Map();
for (const p of parts) {
  const edrpou = clean(p.edrpou);
  if (!edrpou) continue;
  const key = `${p.tender_id}|${edrpou}|${p.role}`;
  const prev = map.get(key);
  if (!prev) {
    map.set(key, { ...p, edrpou, name: clean(p.name) });
  } else {
    prev.amount = Math.max(prev.amount ?? 0, p.amount ?? 0);
    if ((p.date || "") > (prev.date || "")) prev.date = p.date;
    prev.name = prev.name || clean(p.name);
  }
}

db.exec("BEGIN");
try {
  for (const t of tenders) {
    updateTender.run(clean(t.buyer_edrpou), clean(t.winner_edrpou), clean(t.buyer_name), t.id);
  }

  db.exec("DELETE FROM participations");
  const insert = db.prepare(
    "INSERT OR REPLACE INTO participations (tender_id, edrpou, name, role, amount, status, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  for (const p of map.values()) {
    insert.run(p.tender_id, p.edrpou, p.name, p.role, p.amount ?? null, p.status ?? null, p.date ?? null);
  }

  db.exec(`
    DELETE FROM companies;
    INSERT INTO companies (edrpou, name, kind, tenders, wins, total, last_date, regions, cpvs)
    SELECT
      p.edrpou,
      (SELECT p2.name FROM participations p2 WHERE p2.edrpou = p.edrpou AND p2.name <> '' ORDER BY p2.date DESC LIMIT 1),
      CASE
        WHEN SUM(CASE WHEN p.role = 'buyer' THEN 1 ELSE 0 END) > 0
         AND SUM(CASE WHEN p.role IN ('supplier','bidder') THEN 1 ELSE 0 END) > 0 THEN 'both'
        WHEN SUM(CASE WHEN p.role = 'buyer' THEN 1 ELSE 0 END) > 0 THEN 'buyer'
        ELSE 'supplier'
      END,
      COUNT(DISTINCT p.tender_id),
      SUM(CASE WHEN p.role = 'supplier' AND p.status = 'active' THEN 1 ELSE 0 END),
      SUM(CASE WHEN p.role = 'supplier' AND p.status = 'active' THEN COALESCE(p.amount, 0) ELSE 0 END),
      MAX(p.date),
      (SELECT COUNT(DISTINCT t.buyer_region) FROM participations p3 JOIN tenders t ON t.id = p3.tender_id
        WHERE p3.edrpou = p.edrpou AND t.buyer_region IS NOT NULL),
      (SELECT COUNT(DISTINCT t.cpv_section) FROM participations p3 JOIN tenders t ON t.id = p3.tender_id
        WHERE p3.edrpou = p.edrpou AND t.cpv_section <> '')
    FROM participations p
    GROUP BY p.edrpou
  `);
  db.exec(`
    UPDATE companies
    SET buyer_total = (
      SELECT COALESCE(SUM(t.amount), 0) FROM tenders t WHERE t.buyer_edrpou = companies.edrpou
    )
  `);
  const rows = db.prepare("SELECT edrpou, name FROM companies").all();
  const update = db.prepare("UPDATE companies SET search_text = ? WHERE edrpou = ?");
  for (const row of rows) update.run(`${row.name || ""} ${row.edrpou}`.toLowerCase(), row.edrpou);
  db.exec("COMMIT");
} catch (err) {
  db.exec("ROLLBACK");
  throw err;
}

console.log("companies:", db.prepare("SELECT COUNT(*) AS n FROM companies").get().n);
console.log(
  "check:",
  db.prepare("SELECT edrpou, name FROM companies WHERE edrpou IN ('00883498','32498244','38086058')").all(),
);
