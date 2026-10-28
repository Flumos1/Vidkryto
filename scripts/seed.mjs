/**
 * Seed the local database with real ProZorro data.
 * Usage: node scripts/seed.mjs [pages]
 * Each page = 100 tenders. Default 30 pages (~3000 tenders).
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DATA_DIR = resolve(ROOT, "data");
mkdirSync(DATA_DIR, { recursive: true });

const API = "https://public-api.prozorro.gov.ua/api/2.5";
const PAGES = Number(process.argv[2] || 30);
const CONCURRENCY = 18;
const UA = "Vidkryto/1.0 (open procurement analytics; contact: hello@vidkryto.local)";

const dbFile = process.env.DB_FILE || resolve(DATA_DIR, "clarity.db");
const db = new DatabaseSync(dbFile);

db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

CREATE TABLE IF NOT EXISTS tenders (
  id TEXT PRIMARY KEY,
  tender_id TEXT,
  title TEXT,
  description TEXT,
  status TEXT,
  status_raw TEXT,
  method_type TEXT,
  method TEXT,
  category TEXT,
  amount REAL,
  currency TEXT,
  vat INTEGER,
  buyer_name TEXT,
  buyer_edrpou TEXT,
  buyer_region TEXT,
  buyer_locality TEXT,
  buyer_kind TEXT,
  buyer_email TEXT,
  cpv TEXT,
  cpv_name TEXT,
  cpv_section TEXT,
  date_created TEXT,
  date_modified TEXT,
  period_start TEXT,
  period_end TEXT,
  bids_count INTEGER,
  awards_count INTEGER,
  docs_count INTEGER,
  winner_name TEXT,
  winner_edrpou TEXT,
  winner_amount REAL,
  items_json TEXT,
  awards_json TEXT,
  bids_json TEXT,
  documents_json TEXT,
  complaints_json TEXT,
  contracts_json TEXT,
  dates_json TEXT,
  questions_count INTEGER,
  created_ts REAL,
  search_text TEXT
);

CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_region ON tenders(buyer_region);
CREATE INDEX IF NOT EXISTS idx_tenders_cpv ON tenders(cpv_section);
CREATE INDEX IF NOT EXISTS idx_tenders_created ON tenders(date_created);
CREATE INDEX IF NOT EXISTS idx_tenders_amount ON tenders(amount);
CREATE INDEX IF NOT EXISTS idx_tenders_buyer ON tenders(buyer_edrpou);

CREATE TABLE IF NOT EXISTS participations (
  tender_id TEXT,
  edrpou TEXT,
  name TEXT,
  role TEXT,
  amount REAL,
  status TEXT,
  date TEXT,
  PRIMARY KEY (tender_id, edrpou, role)
);
CREATE INDEX IF NOT EXISTS idx_part_edrpou ON participations(edrpou);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  password_hash TEXT,
  created_at TEXT,
  plan TEXT DEFAULT 'demo'
);

CREATE TABLE IF NOT EXISTS saved_searches (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  params_json TEXT,
  created_at TEXT,
  last_checked TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  search_id TEXT,
  tender_id TEXT,
  title TEXT,
  created_at TEXT,
  read INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  key TEXT UNIQUE,
  created_at TEXT,
  last_used TEXT,
  requests INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sync_state (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS companies (
  edrpou TEXT PRIMARY KEY,
  name TEXT,
  kind TEXT,
  tenders INTEGER,
  wins INTEGER,
  total REAL,
  last_date TEXT,
  regions TEXT,
  cpvs TEXT,
  search_text TEXT,
  buyer_total REAL DEFAULT 0
);
`);

function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
ensureColumn("tenders", "search_text", "TEXT");
ensureColumn("companies", "search_text", "TEXT");

const REGION_MAP = {  "м. Київ": "Київ",
  "м.Київ": "Київ",
  "Київ": "Київ",
  "м. Севастополь": "Севастополь",
};

function normRegion(raw) {
  if (!raw) return "Не вказано";
  let r = String(raw).trim();
  if (REGION_MAP[r]) return REGION_MAP[r];
  r = r.replace(/\s*область$/i, "").replace(/^м\.\s*/i, "").trim();
  return r || "Не вказано";
}

const STATUS_MAP = (s) => {
  if (!s) return "unknown";
  if (s.startsWith("active.")) return "active";
  if (s === "active") return "active";
  return s;
};

const CPV_SECTIONS = {
  "03": "Сільгосппродукція",
  "09": "Нафтопродукти",
  "14": "Гірнича сировина",
  "15": "Харчові продукти",
  "16": "Сільгосптехніка",
  "18": "Одяг та взуття",
  "19": "Текстиль",
  "22": "Друкована продукція",
  "24": "Хімічна продукція",
  "30": "Комп'ютерна техніка",
  "31": "Електрообладнання",
  "32": "Радіо та зв'язок",
  "33": "Медичне обладнання",
  "34": "Транспорт",
  "35": "Безпека та охорона",
  "37": "Музичні інструменти",
  "38": "Лабораторне обладнання",
  "39": "Меблі",
  "41": "Водопостачання",
  "42": "Труби та арматура",
  "43": "Гірниче обладнання",
  "44": "Будматеріали",
  "45": "Будівництво",
  "48": "Програмне забезпечення",
  "50": "Ремонт і обслуговування",
  "51": "Монтаж обладнання",
  "55": "Готельні послуги",
  "60": "Транспортні послуги",
  "63": "Логістика",
  "64": "Поштові послуги",
  "65": "Комунальні послуги",
  "66": "Фінансові послуги",
  "70": "Нерухомість",
  "71": "Архітектура та інженерія",
  "72": "IT-послуги",
  "73": "Дослідження",
  "75": "Державне управління",
  "76": "Бізнес-послуги",
  "77": "Сільгосппослуги",
  "79": "Адміністративні послуги",
  "80": "Освіта",
  "85": "Охорона здоров'я",
  "90": "Довкілля",
  "92": "Культура та спорт",
  "98": "Інші послуги",
};

function cpvSectionName(code) {
  if (!code) return "Інше";
  return CPV_SECTIONS[code.slice(0, 2)] || "Інше";
}

function asNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function compactSupplier(s) {
  if (!s) return null;
  return {
    name: (s.name || s.legalName || "").trim(),
    edrpou: String(s.identifier?.id || "").replace(/[\u00A0\u2007\u202F]/g, " ").trim(),
    scheme: s.identifier?.scheme || "",
    region: normRegion(s.address?.region),
    locality: s.address?.locality || "",
    street: s.address?.streetAddress || "",
    email: s.contactPoint?.email || "",
    phone: s.contactPoint?.telephone || "",
  };
}

function compactDoc(d) {
  return {
    title: d.title || "Документ",
    url: d.url || "",
    type: d.documentType || "",
    format: d.format || "",
    date: d.datePublished || "",
  };
}

function trimTender(t) {
  const items = (t.items || []).map((it) => ({
    id: it.id,
    description: it.description,
    quantity: it.quantity ?? null,
    unit: it.unit?.name || "",
    cpv: it.classification?.id || "",
    cpvName: it.classification?.description || "",
    region: normRegion(it.deliveryAddress?.region),
  }));
  const awards = (t.awards || []).map((a) => ({
    id: a.id,
    status: a.status,
    date: a.date,
    value: asNumber(a.value?.amount),
    currency: a.value?.currency || "UAH",
    suppliers: (a.suppliers || []).map(compactSupplier),
    documents: (a.documents || []).map(compactDoc),
  }));
  const bids = (t.bids || []).map((b) => ({
    id: b.id,
    status: b.status,
    date: b.date,
    value: asNumber(b.value?.amount),
    tenderers: (b.tenderers || []).map(compactSupplier),
  }));
  const documents = (t.documents || []).map(compactDoc);
  const complaints = (t.complaints || []).map((c) => ({
    id: c.id,
    status: c.status,
    title: c.title || "",
    date: c.date || "",
  }));
  const contracts = (t.contracts || []).map((c) => ({
    id: c.id,
    status: c.status,
    value: asNumber(c.value?.amount),
    suppliers: (c.suppliers || []).map(compactSupplier),
    documents: (c.documents || []).map(compactDoc),
  }));

  return { items, awards, bids, documents, complaints, contracts };
}

function normalize(t) {
  const buyer = t.procuringEntity || {};
  const buyerId = buyer.identifier || {};
  const first = t.items?.[0];
  const cpv = first?.classification?.id || "";
  const awards = t.awards || [];
  const activeAwards = awards.filter((a) => a.status === "active");
  const winner = activeAwards.at(-1) || awards.at(-1);
  const winnerSupplier = winner?.suppliers?.[0];
  const winnerAmount = activeAwards.reduce((sum, a) => sum + (asNumber(a.value?.amount) || 0), 0) || null;

  const trimmed = trimTender(t);
  const created = t.dateCreated || t.date || t.dateModified || null;

  return {
    id: t.id,
    tender_id: t.tenderID || "",
    title: (t.title || "").trim() || "Закупівля без назви",
    description: t.description || "",
    status: STATUS_MAP(t.status),
    status_raw: t.status || "",
    method_type: t.procurementMethodType || "",
    method: t.procurementMethod || "",
    category: t.mainProcurementCategory || "",
    amount: asNumber(t.value?.amount),
    currency: t.value?.currency || "UAH",
    vat: t.value?.valueAddedTaxIncluded ? 1 : 0,
    buyer_name: buyer.name || buyer.identifier?.legalName || "",
    buyer_edrpou: String(buyerId.id || "").replace(/[\u00A0\u2007\u202F]/g, " ").trim(),
    buyer_region: normRegion(buyer.address?.region),
    buyer_locality: buyer.address?.locality || "",
    buyer_kind: buyer.kind || "",
    buyer_email: buyer.contactPoint?.email || "",
    cpv,
    cpv_name: first?.classification?.description || cpvSectionName(cpv),
    cpv_section: cpv ? cpv.slice(0, 2) : "",
    date_created: created,
    date_modified: t.dateModified || created,
    period_start: t.tenderPeriod?.startDate || null,
    period_end: t.tenderPeriod?.endDate || null,
    bids_count: t.bids?.length || 0,
    awards_count: awards.length,
    docs_count: t.documents?.length || 0,
    winner_name: winnerSupplier?.name || "",
    winner_edrpou: String(winnerSupplier?.identifier?.id || "").replace(/[\u00A0\u2007\u202F]/g, " ").trim(),
    winner_amount: winnerAmount,
    items_json: JSON.stringify(trimmed.items),
    awards_json: JSON.stringify(trimmed.awards),
    bids_json: JSON.stringify(trimmed.bids),
    documents_json: JSON.stringify(trimmed.documents),
    complaints_json: JSON.stringify(trimmed.complaints),
    contracts_json: JSON.stringify(trimmed.contracts),
    dates_json: JSON.stringify({
      created: t.dateCreated,
      modified: t.dateModified,
      tenderPeriod: t.tenderPeriod || null,
      enquiryPeriod: t.enquiryPeriod || null,
      auctionPeriod: t.auctionPeriod || null,
      awardPeriod: t.awardPeriod || null,
    }),
    questions_count: t.questions?.length || 0,
    created_ts: created ? new Date(created).getTime() / 1000 : Date.now() / 1000,
    search_text: [
      t.title || "",
      buyer.name || buyer.identifier?.legalName || "",
      first?.classification?.description || "",
      winnerSupplier?.name || "",
      t.tenderID || "",
    ]
      .join(" ")
      .toLowerCase(),
    _buyer: { name: buyer.name || "", edrpou: buyerId.id || "", region: normRegion(buyer.address?.region), date: created },
    _items: trimmed.items,
    _awards: trimmed.awards,
    _bids: trimmed.bids,
  };
}

async function getJson(url, attempt = 1) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(45000),
    });
    if (res.status === 429) throw new Error("rate limited");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (attempt < 4) {
      await new Promise((r) => setTimeout(r, 600 * attempt));
      return getJson(url, attempt + 1);
    }
    throw err;
  }
}

async function collectIds(pages) {
  const ids = new Set();
  let offset = null;
  for (let page = 0; page < pages; page++) {
    const url = offset
      ? `${API}/tenders?descending=dateModified&limit=100&offset=${encodeURIComponent(offset)}`
      : `${API}/tenders?descending=dateModified&limit=100`;
    const json = await getJson(url);
    for (const t of json.data || []) ids.add(t.id);
    process.stdout.write(`\rlist page ${page + 1}/${pages} — ${ids.size} ids`);
    offset = json.next_page?.offset;
    if (!offset) break;
  }
  process.stdout.write("\n");
  return [...ids];
}

async function pool(items, limit, worker) {
  let cursor = 0;
  let done = 0;
  const failures = [];
  const runners = Array.from({ length: limit }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      const item = items[idx];
      try {
        await worker(item, idx);
      } catch (err) {
        failures.push({ item, error: String(err) });
      } finally {
        done++;
        if (done % 50 === 0 || done === items.length) {
          process.stdout.write(`\rdetails ${done}/${items.length} (errors: ${failures.length})`);
        }
      }
    }
  });
  await Promise.all(runners);
  process.stdout.write("\n");
  return failures;
}

const insertTender = db.prepare(`
  INSERT INTO tenders (
    id, tender_id, title, description, status, status_raw, method_type, method, category,
    amount, currency, vat, buyer_name, buyer_edrpou, buyer_region, buyer_locality, buyer_kind, buyer_email,
    cpv, cpv_name, cpv_section, date_created, date_modified, period_start, period_end,
    bids_count, awards_count, docs_count, winner_name, winner_edrpou, winner_amount,
    items_json, awards_json, bids_json, documents_json, complaints_json, contracts_json, dates_json,
    questions_count, created_ts, search_text
  ) VALUES (
    @id, @tender_id, @title, @description, @status, @status_raw, @method_type, @method, @category,
    @amount, @currency, @vat, @buyer_name, @buyer_edrpou, @buyer_region, @buyer_locality, @buyer_kind, @buyer_email,
    @cpv, @cpv_name, @cpv_section, @date_created, @date_modified, @period_start, @period_end,
    @bids_count, @awards_count, @docs_count, @winner_name, @winner_edrpou, @winner_amount,
    @items_json, @awards_json, @bids_json, @documents_json, @complaints_json, @contracts_json, @dates_json,
    @questions_count, @created_ts, @search_text
  )
  ON CONFLICT(id) DO UPDATE SET
    title = excluded.title, description = excluded.description, status = excluded.status,
    status_raw = excluded.status_raw, amount = excluded.amount, date_modified = excluded.date_modified,
    bids_count = excluded.bids_count, awards_count = excluded.awards_count,
    winner_name = excluded.winner_name, winner_edrpou = excluded.winner_edrpou,
    winner_amount = excluded.winner_amount, items_json = excluded.items_json,
    awards_json = excluded.awards_json, bids_json = excluded.bids_json,
    documents_json = excluded.documents_json, contracts_json = excluded.contracts_json,
    dates_json = excluded.dates_json, search_text = excluded.search_text
`);

const insertPart = db.prepare(`
  INSERT INTO participations (tender_id, edrpou, name, role, amount, status, date)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(tender_id, edrpou, role) DO UPDATE SET
    amount = excluded.amount, status = excluded.status, name = excluded.name
`);

function insertRows(rows) {
  db.exec("BEGIN");
  try {
    for (const row of rows) {
      const { _buyer, _items, _awards, _bids, ...params } = row;
      insertTender.run(params);
      if (_buyer.edrpou) {
        insertPart.run(row.id, _buyer.edrpou, _buyer.name ?? "", "buyer", row.amount ?? null, "buyer", _buyer.date ?? null);
      }
      for (const award of _awards) {
        for (const s of award.suppliers || []) {
          if (!s.edrpou) continue;
          insertPart.run(row.id, s.edrpou, s.name ?? "", "supplier", award.value ?? null, award.status ?? null, award.date ?? null);
        }
      }
      for (const bid of _bids) {
        for (const s of bid.tenderers || []) {
          if (!s.edrpou) continue;
          insertPart.run(row.id, s.edrpou, s.name ?? "", "bidder", bid.value ?? null, bid.status ?? null, bid.date ?? null);
        }
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

function rebuildCompanies() {
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
    WHERE p.edrpou IS NOT NULL AND p.edrpou <> ''
    GROUP BY p.edrpou;
  `);
  const rows = db.prepare(`SELECT edrpou, name FROM companies`).all();
  const update = db.prepare(`UPDATE companies SET search_text = ? WHERE edrpou = ?`);
  db.exec("BEGIN");
  for (const row of rows) {
    update.run(`${row.name || ""} ${row.edrpou}`.toLowerCase(), row.edrpou);
  }
  db.exec("COMMIT");
  db.exec(`
    UPDATE companies
    SET buyer_total = (
      SELECT COALESCE(SUM(t.amount), 0) FROM tenders t WHERE t.buyer_edrpou = companies.edrpou
    )
  `);
}

async function main() {
  console.log(`Seeding ${PAGES} pages from ${API}`);
  const started = Date.now();
  const ids = await collectIds(PAGES);

  const rows = [];
  const failures = await pool(ids, CONCURRENCY, async (id) => {
    const json = await getJson(`${API}/tenders/${id}`);
    if (!json.data) return;
    const row = normalize(json.data);
    if (!row.title) return;
    delete row._buyer;
    rows.push(row);
  });

  console.log(`Fetched ${rows.length} tenders, ${failures.length} failures in ${((Date.now() - started) / 1000).toFixed(0)}s`);
  if (rows.length === 0) {
    console.error("No data fetched — aborting so existing DB is preserved.");
    process.exit(1);
  }

  const chunk = 200;
  for (let i = 0; i < rows.length; i += chunk) {
    const part = rows.slice(i, i + chunk).map((r) => {
      const full = { ...r };
      full._buyer = { name: r.buyer_name, edrpou: r.buyer_edrpou, region: r.buyer_region, date: r.date_created };
      full._items = JSON.parse(r.items_json);
      full._awards = JSON.parse(r.awards_json);
      full._bids = JSON.parse(r.bids_json);
      return full;
    });
    insertRows(part);
  }

  rebuildCompanies();

  const now = new Date().toISOString();
  db.prepare(`INSERT INTO sync_state (key, value) VALUES ('last_seed', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(now);
  db.prepare(`INSERT INTO sync_state (key, value) VALUES ('tender_count', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(String(rows.length));

  const stats = db
    .prepare(`SELECT COUNT(*) AS n, ROUND(SUM(amount)) AS total, MIN(date_created) AS older, MAX(date_created) AS newer FROM tenders`)
    .get();
  console.log("DB stats:", stats);
  console.log(`Done in ${((Date.now() - started) / 1000).toFixed(0)}s → ${dbFile}`);
  db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
