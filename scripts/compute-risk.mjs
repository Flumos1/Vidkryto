/**
 * Computes a transparent risk profile for supplier companies.
 * Factors: sanctions match, AMKU violations, single-bid wins, buyer concentration,
 * price premium over the CPV-section median.
 *
 * Usage: node scripts/compute-risk.mjs
 */
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const DB_FILE = process.env.DB_FILE || path.join(process.cwd(), "data", "clarity.db");
const db = new DatabaseSync(DB_FILE);

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

function normalizeName(raw) {
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

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const columns = db.prepare("PRAGMA table_info(companies)").all();
const ensureColumn = (name, definition) => {
  if (!columns.some((c) => c.name === name)) db.exec(`ALTER TABLE companies ADD COLUMN ${name} ${definition}`);
};
ensureColumn("risk_score", "INTEGER DEFAULT 0");
ensureColumn("risk_level", "TEXT DEFAULT 'low'");
ensureColumn("risk_factors_json", "TEXT");

console.log("[risk] loading data");
const companies = db
  .prepare("SELECT edrpou, name, kind FROM companies WHERE kind IN ('supplier','both')")
  .all();
const amku = new Map(
  db
    .prepare("SELECT edrpou, COUNT(*) AS n FROM amku_violations GROUP BY edrpou")
    .all()
    .map((row) => [row.edrpou, row.n]),
);
const sanctioned = new Set(
  db.prepare("SELECT normalized_name FROM sanctions").all().map((row) => row.normalized_name),
);
const wins = db
  .prepare(
    `SELECT p.edrpou, p.tender_id, p.amount, t.bids_count, t.buyer_edrpou, t.cpv_section, t.winner_amount
     FROM participations p JOIN tenders t ON t.id = p.tender_id
     WHERE p.role = 'supplier' AND p.status = 'active'`,
  )
  .all();

const sectionValues = new Map();
for (const row of db
  .prepare("SELECT cpv_section, winner_amount FROM tenders WHERE winner_amount > 0 AND cpv_section <> ''")
  .all()) {
  if (!sectionValues.has(row.cpv_section)) sectionValues.set(row.cpv_section, []);
  sectionValues.get(row.cpv_section).push(row.winner_amount);
}
const sectionMedian = new Map([...sectionValues.entries()].map(([code, values]) => [code, median(values)]));

const byCompany = new Map();
for (const win of wins) {
  if (!byCompany.has(win.edrpou)) {
    byCompany.set(win.edrpou, { tenders: new Set(), single: 0, buyers: new Map(), ratios: [] });
  }
  const entry = byCompany.get(win.edrpou);
  entry.tenders.add(win.tender_id);
  if ((win.bids_count ?? 0) <= 1) entry.single++;
  if (win.buyer_edrpou) entry.buyers.set(win.buyer_edrpou, (entry.buyers.get(win.buyer_edrpou) || 0) + 1);
  const medianValue = sectionMedian.get(win.cpv_section) || 0;
  if (medianValue > 0 && win.amount > 0) entry.ratios.push(win.amount / medianValue);
}

const update = db.prepare(
  "UPDATE companies SET risk_score = ?, risk_level = ?, risk_factors_json = ? WHERE edrpou = ?",
);

let scored = 0;
db.exec("BEGIN");
try {
  for (const company of companies) {
    const entry = byCompany.get(company.edrpou);
    const winCount = entry ? entry.tenders.size : 0;
    const factors = [];
    let score = 0;

    if (sanctioned.has(normalizeName(company.name))) {
      score += 40;
      factors.push({ key: "sanctions", label: "Санкційні списки", value: "збіг за назвою", points: 40, tone: "danger" });
    }

    const amkuCount = amku.get(company.edrpou) || 0;
    if (amkuCount > 0) {
      const points = Math.min(25, amkuCount * 8);
      score += points;
      factors.push({
        key: "amku",
        label: "Рішення АМКУ",
        value: `${amkuCount} рішень`,
        points,
        tone: "warn",
      });
    }

    if (winCount >= 2 && entry) {
      const singleShare = entry.single / winCount;
      const points = Math.round(singleShare * 20);
      if (points > 0) {
        score += points;
        factors.push({
          key: "single_bid",
          label: "Перемоги з єдиною заявкою",
          value: `${entry.single} з ${winCount}`,
          points,
          tone: "warn",
        });
      }

      const topBuyer = Math.max(0, ...entry.buyers.values());
      const concentration = topBuyer / winCount;
      if (concentration > 0.5 && winCount >= 3) {
        const points = Math.min(10, Math.round((concentration - 0.5) * 20));
        score += points;
        factors.push({
          key: "concentration",
          label: "Концентрація на замовнику",
          value: `${Math.round(concentration * 100)}% перемог`,
          points,
          tone: "warn",
        });
      }

      const avgRatio = entry.ratios.length
        ? entry.ratios.reduce((sum, value) => sum + value, 0) / entry.ratios.length
        : 0;
      if (avgRatio > 1.15 && winCount >= 3) {
        const points = Math.min(15, Math.round((avgRatio - 1.15) * 30));
        if (points > 0) {
          score += points;
          factors.push({
            key: "price",
            label: "Ціна вище медіани КПВ",
            value: `+${Math.round((avgRatio - 1) * 100)}%`,
            points,
            tone: "warn",
          });
        }
      }
    }

    score = Math.min(100, score);
    const level = score >= 40 ? "high" : score >= 20 ? "medium" : "low";
    update.run(score, level, JSON.stringify(factors), company.edrpou);
    scored++;
  }
  db.exec("COMMIT");
} catch (err) {
  db.exec("ROLLBACK");
  throw err;
}

const stats = db
  .prepare("SELECT risk_level, COUNT(*) AS n FROM companies GROUP BY risk_level")
  .all();
db.prepare(
  "INSERT INTO sync_state (key, value) VALUES ('risk_updated', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
).run(new Date().toISOString());
console.log(`[risk] scored ${scored} companies`, stats);
db.close();
