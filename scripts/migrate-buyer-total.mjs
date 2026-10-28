import { DatabaseSync } from "node:sqlite";
import { resolve } from "node:path";

const db = new DatabaseSync(process.env.DB_FILE || resolve("data/clarity.db"));
const cols = db.prepare("PRAGMA table_info(companies)").all();
if (!cols.some((c) => c.name === "buyer_total")) {
  db.exec("ALTER TABLE companies ADD COLUMN buyer_total REAL DEFAULT 0");
}
db.exec(`
  UPDATE companies
  SET buyer_total = (
    SELECT COALESCE(SUM(t.amount), 0) FROM tenders t WHERE t.buyer_edrpou = companies.edrpou
  )
`);
const stats = db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(buyer_total),0) AS total FROM companies").get();
console.log("companies:", stats);
