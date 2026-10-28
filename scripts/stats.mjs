import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync(process.env.DB_FILE || "data/clarity.db");
const tenders = db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(amount),0) AS amount FROM tenders").get();
const companies = db.prepare("SELECT COUNT(*) AS n, SUM(kind = 'supplier') AS suppliers, SUM(kind = 'buyer') AS buyers FROM companies").get();
const latest = db.prepare("SELECT MAX(date_created) AS d FROM tenders").get();
const oldest = db.prepare("SELECT MIN(date_created) AS d FROM tenders").get();
const seeded = db.prepare("SELECT value FROM sync_state WHERE key = 'last_seed'").get();

console.log("Vidkryto database");
console.log("-----------------");
console.log(`Tenders:   ${tenders.n}`);
console.log(`Turnover:  ${(tenders.amount / 1e9).toFixed(2)} bn UAH`);
console.log(`Companies: ${companies.n} (buyers: ${companies.buyers}, suppliers: ${companies.suppliers})`);
console.log(`Period:    ${oldest.d?.slice(0, 10)} → ${latest.d?.slice(0, 10)}`);
console.log(`Seeded:    ${seeded?.value ?? "—"}`);
