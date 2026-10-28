import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("data/clarity.db");

db.exec("BEGIN");
try {
  db.exec(`
    UPDATE tenders
    SET buyer_edrpou = TRIM(COALESCE(buyer_edrpou, '')),
        winner_edrpou = TRIM(COALESCE(winner_edrpou, '')),
        buyer_name = TRIM(COALESCE(buyer_name, ''))
  `);

  db.exec(`
    CREATE TABLE participations_new (
      tender_id TEXT,
      edrpou TEXT,
      name TEXT,
      role TEXT,
      amount REAL,
      status TEXT,
      date TEXT,
      PRIMARY KEY (tender_id, edrpou, role)
    )
  `);
  db.exec(`
    INSERT OR REPLACE INTO participations_new (tender_id, edrpou, name, role, amount, status, date)
    SELECT tender_id, TRIM(COALESCE(edrpou, '')), TRIM(COALESCE(name, '')), role,
           MAX(amount), MAX(status), MAX(date)
    FROM participations
    WHERE TRIM(COALESCE(edrpou, '')) <> ''
    GROUP BY tender_id, TRIM(COALESCE(edrpou, '')), role
  `);
  db.exec("DROP TABLE participations");
  db.exec("ALTER TABLE participations_new RENAME TO participations");
  db.exec("CREATE INDEX IF NOT EXISTS idx_part_edrpou ON participations(edrpou)");

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
  for (const row of rows) {
    update.run(`${row.name || ""} ${row.edrpou}`.toLowerCase(), row.edrpou);
  }

  db.exec("COMMIT");
} catch (err) {
  db.exec("ROLLBACK");
  throw err;
}

console.log(db.prepare("SELECT COUNT(*) AS companies FROM companies").get());
console.log(db.prepare("SELECT edrpou, name FROM companies WHERE edrpou IN ('00883498','32498244')").all());
