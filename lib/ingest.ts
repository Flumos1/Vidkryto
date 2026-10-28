import crypto from "node:crypto";
import { getDb } from "./db";

const API = "https://public-api.prozorro.gov.ua/api/2.5";
const UA = "Vidkryto/1.0 (open procurement analytics)";

const REGION_MAP: Record<string, string> = {
  "м. Київ": "Київ",
  "м.Київ": "Київ",
  "м. Севастополь": "Севастополь",
};

function normRegion(raw?: string | null): string {
  if (!raw) return "Не вказано";
  let r = String(raw).trim();
  if (REGION_MAP[r]) return REGION_MAP[r];
  r = r.replace(/\s*область$/i, "").replace(/^м\.\s*/i, "").trim();
  return r || "Не вказано";
}

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

type Supplier = {
  name?: string;
  identifier?: { id?: string; scheme?: string };
  address?: { region?: string; locality?: string };
  contactPoint?: { email?: string };
};

type RawTender = {
  id: string;
  tenderID?: string;
  title?: string;
  description?: string;
  status?: string;
  procurementMethodType?: string;
  procurementMethod?: string;
  mainProcurementCategory?: string;
  value?: { amount?: number; currency?: string; valueAddedTaxIncluded?: boolean };
  procuringEntity?: {
    name?: string;
    kind?: string;
    identifier?: { id?: string; legalName?: string };
    address?: { region?: string; locality?: string };
    contactPoint?: { email?: string };
  };
  items?: {
    id?: string;
    description?: string;
    quantity?: number;
    unit?: { name?: string };
    classification?: { id?: string; description?: string };
    deliveryAddress?: { region?: string };
  }[];
  awards?: {
    id?: string;
    status?: string;
    date?: string;
    value?: { amount?: number };
    suppliers?: Supplier[];
    documents?: { title?: string; url?: string; documentType?: string }[];
  }[];
  bids?: {
    id?: string;
    status?: string;
    date?: string;
    value?: { amount?: number };
    tenderers?: Supplier[];
  }[];
  documents?: { title?: string; url?: string; documentType?: string; format?: string; datePublished?: string }[];
  complaints?: { id?: string; status?: string; title?: string; date?: string }[];
  contracts?: { id?: string; status?: string; value?: { amount?: number }; suppliers?: Supplier[] }[];
  dateCreated?: string;
  dateModified?: string;
  tenderPeriod?: { startDate?: string; endDate?: string };
  questions?: unknown[];
};

function compactSupplier(s: Supplier) {
  const clean = (v?: string) => String(v || "").replace(/[\u00A0\u2007\u202F]/g, " ").trim();
  return {
    name: clean(s?.name),
    edrpou: clean(s?.identifier?.id),
    scheme: s?.identifier?.scheme || "",
    region: normRegion(s?.address?.region),
    locality: s?.address?.locality || "",
    email: s?.contactPoint?.email || "",
  };
}

function compactDoc(d: { title?: string; url?: string; documentType?: string; format?: string; datePublished?: string }) {
  return {
    title: d.title || "Документ",
    url: d.url || "",
    type: d.documentType || "",
    format: d.format || "",
    date: d.datePublished || "",
  };
}

export function normalizeTender(t: RawTender) {
  const buyer = t.procuringEntity || {};
  const first = t.items?.[0];
  const cpv = first?.classification?.id || "";
  const awards = t.awards || [];
  const active = awards.filter((a) => a.status === "active");
  const winner = active.at(-1) || awards.at(-1);
  const winnerSupplier = winner?.suppliers?.[0];
  const items = (t.items || []).map((it) => ({
    id: it.id,
    description: it.description || "",
    quantity: it.quantity ?? null,
    unit: it.unit?.name || "",
    cpv: it.classification?.id || "",
    cpvName: it.classification?.description || "",
    region: normRegion(it.deliveryAddress?.region),
  }));
  const awardJson = awards.map((a) => ({
    id: a.id,
    status: a.status,
    date: a.date,
    value: num(a.value?.amount),
    suppliers: (a.suppliers || []).map(compactSupplier),
    documents: (a.documents || []).map(compactDoc),
  }));
  const bidJson = (t.bids || []).map((b) => ({
    id: b.id,
    status: b.status,
    date: b.date,
    value: num(b.value?.amount),
    tenderers: (b.tenderers || []).map(compactSupplier),
  }));
  const docs = (t.documents || []).map(compactDoc);
  const winnerAmount = active.reduce((sum, a) => sum + (num(a.value?.amount) || 0), 0) || null;
  const status = t.status?.startsWith("active.") ? "active" : t.status || "unknown";
  const created = t.dateCreated || t.dateModified || new Date().toISOString();

  return {
    id: t.id,
    tender_id: t.tenderID || "",
    title: (t.title || "").trim() || "Закупівля без назви",
    description: t.description || "",
    status,
    status_raw: t.status || "",
    method_type: t.procurementMethodType || "",
    method: t.procurementMethod || "",
    category: t.mainProcurementCategory || "",
    amount: num(t.value?.amount),
    currency: t.value?.currency || "UAH",
    vat: t.value?.valueAddedTaxIncluded ? 1 : 0,
    buyer_name: buyer.name || buyer.identifier?.legalName || "",
    buyer_edrpou: String(buyer.identifier?.id || "").replace(/[\u00A0\u2007\u202F]/g, " ").trim(),
    buyer_region: normRegion(buyer.address?.region),
    buyer_locality: buyer.address?.locality || "",
    buyer_kind: buyer.kind || "",
    buyer_email: buyer.contactPoint?.email || "",
    cpv,
    cpv_name: first?.classification?.description || "",
    cpv_section: cpv ? cpv.slice(0, 2) : "",
    date_created: created,
    date_modified: t.dateModified || created,
    period_start: t.tenderPeriod?.startDate || null,
    period_end: t.tenderPeriod?.endDate || null,
    bids_count: t.bids?.length || 0,
    awards_count: awards.length,
    docs_count: t.documents?.length || 0,
    winner_name: winnerSupplier?.name || "",
    winner_edrpou: winnerSupplier?.identifier?.id || "",
    winner_amount: winnerAmount,
    items_json: JSON.stringify(items),
    awards_json: JSON.stringify(awardJson),
    bids_json: JSON.stringify(bidJson),
    documents_json: JSON.stringify(docs),
    complaints_json: JSON.stringify(t.complaints || []),
    contracts_json: JSON.stringify(
      (t.contracts || []).map((c) => ({
        id: c.id,
        status: c.status,
        value: num(c.value?.amount),
        suppliers: (c.suppliers || []).map(compactSupplier),
      })),
    ),
    dates_json: JSON.stringify({
      created: t.dateCreated,
      modified: t.dateModified,
      tenderPeriod: t.tenderPeriod || null,
    }),
    questions_count: t.questions?.length || 0,
    created_ts: new Date(created).getTime() / 1000,
    search_text: [t.title || "", buyer.name || "", first?.classification?.description || "", t.tenderID || ""]
      .join(" ")
      .toLowerCase(),
    _buyer: {
      edrpou: buyer.identifier?.id || "",
      name: buyer.name || "",
      region: normRegion(buyer.address?.region),
      date: created,
    },
    _awards: awardJson,
  };
}

async function getJson(url: string, attempt = 1): Promise<{ data?: RawTender }> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as { data?: RawTender };
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 400 * attempt));
      return getJson(url, attempt + 1);
    }
    throw err;
  }
}

export async function ingestLatest(limit = 40): Promise<{ inserted: number; checked: number }> {
  const db = getDb();
  const list = await getJson(`${API}/tenders?descending=dateModified&limit=${limit}`);
  const ids = (list.data as unknown as { id: string }[] | undefined)?.map((t) => t.id) || [];

  let inserted = 0;
  const rows: ReturnType<typeof normalizeTender>[] = [];
  for (let i = 0; i < ids.length; i += 6) {
    const chunk = ids.slice(i, i + 6);
    const results = await Promise.all(
      chunk.map((id) =>
        getJson(`${API}/tenders/${id}`)
          .then((r) => (r.data ? normalizeTender(r.data) : null))
          .catch(() => null),
      ),
    );
    for (const row of results) if (row) rows.push(row);
  }

  const insert = db.prepare(`
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
      status = excluded.status, status_raw = excluded.status_raw, amount = excluded.amount,
      date_modified = excluded.date_modified, bids_count = excluded.bids_count,
      awards_count = excluded.awards_count, winner_name = excluded.winner_name,
      winner_edrpou = excluded.winner_edrpou, winner_amount = excluded.winner_amount,
      items_json = excluded.items_json, awards_json = excluded.awards_json,
      bids_json = excluded.bids_json, documents_json = excluded.documents_json,
      dates_json = excluded.dates_json
  `);
  const part = db.prepare(`
    INSERT INTO participations (tender_id, edrpou, name, role, amount, status, date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(tender_id, edrpou, role) DO UPDATE SET amount = excluded.amount
  `);

  db.exec("BEGIN");
  try {
    for (const row of rows) {
      const { _buyer, _awards, ...params } = row;
      const existing = db.prepare("SELECT id FROM tenders WHERE id = ?").get(row.id);
      insert.run(params);
      if (!existing) inserted++;
      if (_buyer.edrpou) part.run(row.id, _buyer.edrpou, _buyer.name, "buyer", row.amount, "buyer", _buyer.date);
      for (const a of _awards) {
        for (const s of a.suppliers || []) {
          if (!s.edrpou) continue;
          part.run(row.id, s.edrpou, s.name, "supplier", a.value ?? null, a.status ?? null, a.date ?? null);
        }
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  db.prepare(
    "INSERT INTO sync_state (key, value) VALUES ('last_sync', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  ).run(new Date().toISOString());

  return { inserted, checked: rows.length };
}

export function createNotificationsForUser(userId: string): number {
  const db = getDb();
  const searches = db
    .prepare("SELECT id, name, params_json, last_checked FROM saved_searches WHERE user_id = ?")
    .all(userId) as unknown as { id: string; name: string; params_json: string; last_checked: string | null }[];
  let created = 0;

  for (const search of searches) {
    const params = new URLSearchParams(search.params_json || "");
    const clauses: string[] = ["1 = 1"];
    const args: string[] = [];
    const q = params.get("q");
    if (q) {
      clauses.push("search_text LIKE ?");
      args.push(`%${q.toLowerCase()}%`);
    }
    const region = params.get("region");
    if (region) {
      clauses.push("buyer_region = ?");
      args.push(region);
    }
    const cpv = params.get("cpv");
    if (cpv) {
      clauses.push("cpv LIKE ?");
      args.push(`${cpv}%`);
    }
    const status = params.get("status");
    if (status) {
      clauses.push("status = ?");
      args.push(status);
    }
    if (search.last_checked) {
      clauses.push("date_created > ?");
      args.push(search.last_checked);
    }

    const rows = db
      .prepare(
        `SELECT id, title FROM tenders WHERE ${clauses.join(" AND ")}
         ORDER BY date_created DESC LIMIT 3`,
      )
      .all(...args) as unknown as { id: string; title: string }[];

    for (const row of rows) {
      const exists = db
        .prepare("SELECT id FROM notifications WHERE user_id = ? AND tender_id = ?")
        .get(userId, row.id);
      if (exists) continue;
      db.prepare(
        "INSERT INTO notifications (id, user_id, search_id, tender_id, title, created_at, read) VALUES (?, ?, ?, ?, ?, ?, 0)",
      ).run(crypto.randomUUID(), userId, search.id, row.id, `${search.name}: ${row.title}`, new Date().toISOString());
      created++;
    }

    db.prepare("UPDATE saved_searches SET last_checked = ? WHERE id = ?").run(
      new Date().toISOString(),
      search.id,
    );
  }
  return created;
}
