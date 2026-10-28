import { getDb } from "./db";

export type TenderRow = {
  id: string;
  tender_id: string;
  title: string;
  description: string;
  status: string;
  status_raw: string;
  method_type: string;
  method: string;
  category: string;
  amount: number | null;
  currency: string;
  vat: number;
  buyer_name: string;
  buyer_edrpou: string;
  buyer_region: string;
  buyer_locality: string;
  buyer_kind: string;
  buyer_email: string;
  cpv: string;
  cpv_name: string;
  cpv_section: string;
  date_created: string;
  date_modified: string;
  period_start: string | null;
  period_end: string | null;
  bids_count: number;
  awards_count: number;
  docs_count: number;
  winner_name: string;
  winner_edrpou: string;
  winner_amount: number | null;
  items_json: string;
  awards_json: string;
  bids_json: string;
  documents_json: string;
  complaints_json: string;
  contracts_json: string;
  dates_json: string;
  questions_count: number;
};

export type TenderFilters = {
  q?: string;
  status?: string;
  region?: string;
  cpv?: string;
  method?: string;
  amountMin?: number;
  amountMax?: number;
  from?: string;
  to?: string;
  sort?: string;
  page?: number;
  perPage?: number;
};

export type TenderListResult = {
  rows: TenderRow[];
  total: number;
  page: number;
  pages: number;
  perPage: number;
  totals: { amount: number; average: number };
};

const SORTS: Record<string, string> = {
  date_desc: "date_created DESC",
  date_asc: "date_created ASC",
  amount_desc: "amount DESC NULLS LAST",
  amount_asc: "amount ASC NULLS LAST",
  bids_desc: "bids_count DESC",
};

function buildWhere(filters: TenderFilters) {
  const clauses: string[] = ["1 = 1"];
  const params: (string | number)[] = [];

  if (filters.q) {
    const q = `%${filters.q.trim().toLowerCase()}%`;
    clauses.push(
      "(search_text LIKE ? OR tender_id LIKE ? OR buyer_edrpou LIKE ? OR winner_edrpou LIKE ?)",
    );
    params.push(q, `%${filters.q.trim()}%`, q, q);
  }
  if (filters.status) {
    clauses.push("status = ?");
    params.push(filters.status);
  }
  if (filters.region) {
    clauses.push("buyer_region = ?");
    params.push(filters.region);
  }
  if (filters.cpv) {
    clauses.push("cpv LIKE ?");
    params.push(`${filters.cpv}%`);
  }
  if (filters.method) {
    clauses.push("method_type = ?");
    params.push(filters.method);
  }
  if (filters.amountMin !== undefined) {
    clauses.push("amount >= ?");
    params.push(filters.amountMin);
  }
  if (filters.amountMax !== undefined) {
    clauses.push("amount <= ?");
    params.push(filters.amountMax);
  }
  if (filters.from) {
    clauses.push("substr(date_created, 1, 10) >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    clauses.push("substr(date_created, 1, 10) <= ?");
    params.push(filters.to);
  }
  return { sql: clauses.join(" AND "), params };
}

export function searchTenders(filters: TenderFilters): TenderListResult {
  try {
    const db = getDb();
    const { sql, params } = buildWhere(filters);
    const page = Math.max(1, filters.page || 1);
    const perPage = Math.min(5000, Math.max(1, filters.perPage || 20));
    const order = SORTS[filters.sort || "date_desc"] || SORTS.date_desc;

    const totalRow = db
      .prepare(`SELECT COUNT(*) AS n, COALESCE(SUM(amount), 0) AS sum FROM tenders WHERE ${sql}`)
      .get(...params) as { n: number; sum: number };

    const rows = db
      .prepare(
        `SELECT * FROM tenders WHERE ${sql} ORDER BY ${order} LIMIT ? OFFSET ?`,
      )
      .all(...params, perPage, (page - 1) * perPage) as unknown as TenderRow[];

    return {
      rows,
      total: totalRow.n,
      page,
      pages: Math.max(1, Math.ceil(totalRow.n / perPage)),
      perPage,
      totals: {
        amount: totalRow.sum,
        average: totalRow.n ? totalRow.sum / totalRow.n : 0,
      },
    };
  } catch (err) {
    console.error("searchTenders failed", err);
    return {
      rows: [],
      total: 0,
      page: 1,
      pages: 1,
      perPage: filters.perPage || 20,
      totals: { amount: 0, average: 0 },
    };
  }
}

export type Facet = { value: string; label: string; count: number; amount: number };

export function getFacets(): {
  regions: Facet[];
  statuses: Facet[];
  cpvs: Facet[];
  methods: Facet[];
} {
  try {
    const db = getDb();
    const regions = db
      .prepare(
        `SELECT buyer_region AS value, buyer_region AS label, COUNT(*) AS count,
          COALESCE(SUM(amount), 0) AS amount
         FROM tenders GROUP BY buyer_region ORDER BY count DESC LIMIT 40`,
      )
      .all() as unknown as Facet[];
    const statuses = db
      .prepare(
        `SELECT status AS value, status AS label, COUNT(*) AS count,
          COALESCE(SUM(amount), 0) AS amount
         FROM tenders GROUP BY status ORDER BY count DESC`,
      )
      .all() as unknown as Facet[];
    const cpvs = db
      .prepare(
        `SELECT cpv_section AS value, cpv_section AS label, COUNT(*) AS count,
          COALESCE(SUM(amount), 0) AS amount
         FROM tenders WHERE cpv_section <> '' GROUP BY cpv_section ORDER BY amount DESC LIMIT 60`,
      )
      .all() as unknown as Facet[];
    const methods = db
      .prepare(
        `SELECT method_type AS value, method_type AS label, COUNT(*) AS count,
          COALESCE(SUM(amount), 0) AS amount
         FROM tenders GROUP BY method_type ORDER BY count DESC LIMIT 20`,
      )
      .all() as unknown as Facet[];
    const plain = (rows: Facet[]): Facet[] =>
      rows.map((r) => ({
        value: String(r.value ?? ""),
        label: String(r.label ?? ""),
        count: Number(r.count) || 0,
        amount: Number(r.amount) || 0,
      }));
    return {
      regions: plain(regions),
      statuses: plain(statuses),
      cpvs: plain(cpvs),
      methods: plain(methods),
    };
  } catch {
    return { regions: [], statuses: [], cpvs: [], methods: [] };
  }
}

export function getHomeStats(): {
  tenders: number;
  totalAmount: number;
  buyers: number;
  suppliers: number;
  regions: number;
  companies: number;
  statusCounts: Facet[];
  topRegions: Facet[];
  recent: TenderRow[];
  hourly: { hour: string; count: number; amount: number }[];
  lastUpdated: string | null;
} {
  try {
    const db = getDb();
    const base = db
      .prepare(
        `SELECT COUNT(*) AS tenders, COALESCE(SUM(amount), 0) AS totalAmount,
          COUNT(DISTINCT buyer_edrpou) AS buyers, COUNT(DISTINCT buyer_region) AS regions
         FROM tenders`,
      )
      .get() as { tenders: number; totalAmount: number; buyers: number; regions: number };
    const suppliers = db
      .prepare(`SELECT COUNT(DISTINCT edrpou) AS n FROM participations WHERE role = 'supplier'`)
      .get() as { n: number };
    const companies = db.prepare(`SELECT COUNT(*) AS n FROM companies`).get() as { n: number };
    const statusCounts = db
      .prepare(
        `SELECT status AS value, status AS label, COUNT(*) AS count, COALESCE(SUM(amount),0) AS amount
         FROM tenders GROUP BY status ORDER BY count DESC`,
      )
      .all() as unknown as Facet[];
    const topRegions = db
      .prepare(
        `SELECT buyer_region AS value, buyer_region AS label, COUNT(*) AS count,
          COALESCE(SUM(amount),0) AS amount
         FROM tenders GROUP BY buyer_region ORDER BY amount DESC LIMIT 8`,
      )
      .all() as unknown as Facet[];
    const recent = db
      .prepare(`SELECT * FROM tenders ORDER BY date_created DESC LIMIT 7`)
      .all() as unknown as TenderRow[];
    const hourly = db
      .prepare(
        `SELECT substr(date_created, 1, 13) AS hour, COUNT(*) AS count, COALESCE(SUM(amount),0) AS amount
         FROM tenders GROUP BY hour ORDER BY hour DESC LIMIT 12`,
      )
      .all() as unknown as { hour: string; count: number; amount: number }[];
    const updated = db
      .prepare(`SELECT value FROM sync_state WHERE key = 'last_seed'`)
      .get() as { value: string } | undefined;

    return {
      ...base,
      suppliers: suppliers.n,
      companies: companies.n,
      statusCounts,
      topRegions,
      recent,
      hourly: hourly.reverse(),
      lastUpdated: updated?.value || null,
    };
  } catch {
    return {
      tenders: 0,
      totalAmount: 0,
      buyers: 0,
      suppliers: 0,
      regions: 0,
      companies: 0,
      statusCounts: [],
      topRegions: [],
      recent: [],
      hourly: [],
      lastUpdated: null,
    };
  }
}

export function getTender(idOrTenderId: string): TenderRow | null {
  try {
    const db = getDb();
    const row = db.prepare(`SELECT * FROM tenders WHERE id = ? OR tender_id = ?`).get(
      idOrTenderId,
      idOrTenderId,
    ) as TenderRow | undefined;
    return row ?? null;
  } catch {
    return null;
  }
}

export function getRelatedTenders(row: TenderRow, limit = 4): TenderRow[] {
  try {
    const db = getDb();
    return db
      .prepare(
        `SELECT * FROM tenders
         WHERE id <> ? AND (cpv_section = ? OR buyer_edrpou = ?)
         ORDER BY date_created DESC LIMIT ?`,
      )
      .all(row.id, row.cpv_section, row.buyer_edrpou, limit) as unknown as TenderRow[];
  } catch {
    return [];
  }
}

export type CompanyRow = {
  edrpou: string;
  name: string;
  kind: string;
  tenders: number;
  wins: number;
  total: number;
  buyer_total: number;
  last_date: string | null;
  regions: number;
  cpvs: number;
  search_text?: string;
};

export function searchCompanies(opts: {
  q?: string;
  kind?: string;
  sort?: string;
  page?: number;
  perPage?: number;
}): { rows: CompanyRow[]; total: number; page: number; pages: number } {
  try {
    const db = getDb();
    const page = Math.max(1, opts.page || 1);
    const perPage = Math.min(100, Math.max(1, opts.perPage || 24));
    const where: string[] = ["1 = 1"];
    const params: (string | number)[] = [];
    if (opts.q) {
      where.push("(search_text LIKE ? OR edrpou LIKE ?)");
      const q = `%${opts.q.trim().toLowerCase()}%`;
      params.push(q, `%${opts.q.trim()}%`);
    }
    if (opts.kind && opts.kind !== "all") {
      if (opts.kind === "supplier") where.push("kind IN ('supplier','both')");
      else if (opts.kind === "buyer") where.push("kind IN ('buyer','both')");
      else {
        where.push("kind = ?");
        params.push(opts.kind);
      }
    }
    const order =
      opts.sort === "wins"
        ? "wins DESC, tenders DESC"
        : opts.sort === "amount"
          ? "total DESC"
          : opts.sort === "name"
            ? "name ASC"
            : "tenders DESC, total DESC";
    const sql = where.join(" AND ");
    const total = (
      db.prepare(`SELECT COUNT(*) AS n FROM companies WHERE ${sql}`).get(...params) as {
        n: number;
      }
    ).n;
    const rows = db
      .prepare(`SELECT * FROM companies WHERE ${sql} ORDER BY ${order} LIMIT ? OFFSET ?`)
      .all(...params, perPage, (page - 1) * perPage) as unknown as CompanyRow[];
    return { rows, total, page, pages: Math.max(1, Math.ceil(total / perPage)) };
  } catch {
    return { rows: [], total: 0, page: 1, pages: 1 };
  }
}

export function getCompany(edrpou: string): CompanyRow | null {
  try {
    const db = getDb();
    const row = db
      .prepare(`SELECT * FROM companies WHERE edrpou = ?`)
      .get(String(edrpou).replace(/[\u00A0\u2007\u202F]/g, " ").trim()) as CompanyRow | undefined;
    return row ?? null;
  } catch {
    return null;
  }
}

export type CompanyTenderRow = TenderRow & { role: string; role_amount: number | null };

export function getCompanyTenders(edrpou: string, limit = 25): CompanyTenderRow[] {
  try {
    const db = getDb();
    return db
      .prepare(
        `SELECT t.*, p.role AS role, p.amount AS role_amount
         FROM participations p JOIN tenders t ON t.id = p.tender_id
         WHERE p.edrpou = ?
         GROUP BY t.id
         ORDER BY t.date_created DESC LIMIT ?`,
      )
      .all(edrpou, limit) as unknown as CompanyTenderRow[];
  } catch {
    return [];
  }
}

export function getCompanyCpv(edrpou: string): { code: string; count: number; amount: number }[] {
  try {
    const db = getDb();
    return db
      .prepare(
        `SELECT t.cpv_section AS code, COUNT(*) AS count, COALESCE(SUM(t.amount), 0) AS amount
         FROM participations p JOIN tenders t ON t.id = p.tender_id
         WHERE p.edrpou = ? AND t.cpv_section <> ''
         GROUP BY t.cpv_section ORDER BY amount DESC LIMIT 8`,
      )
      .all(edrpou) as unknown as { code: string; count: number; amount: number }[];
  } catch {
    return [];
  }
}

export function getCompanyCounterparties(
  edrpou: string,
  limit = 6,
): { edrpou: string; name: string; count: number; amount: number }[] {
  try {
    const db = getDb();
    return db
      .prepare(
        `SELECT t.buyer_edrpou AS edrpou, t.buyer_name AS name, COUNT(*) AS count,
          COALESCE(SUM(t.amount), 0) AS amount
         FROM participations p JOIN tenders t ON t.id = p.tender_id
         WHERE p.edrpou = ? AND p.role = 'supplier' AND t.buyer_edrpou <> ''
         GROUP BY t.buyer_edrpou ORDER BY amount DESC LIMIT ?`,
      )
      .all(edrpou, limit) as unknown as {
      edrpou: string;
      name: string;
      count: number;
      amount: number;
    }[];
  } catch {
    return [];
  }
}

export function getAnalytics(): {
  totals: {
    tenders: number;
    amount: number;
    average: number;
    buyers: number;
    suppliers: number;
    bids: number;
    savings: number;
    savingsPct: number;
  };
  byDay: { day: string; count: number; amount: number }[];
  byRegion: Facet[];
  byCpv: Facet[];
  byStatus: Facet[];
  byMethod: Facet[];
  topBuyers: { edrpou: string; name: string; count: number; amount: number }[];
  topSuppliers: { edrpou: string; name: string; count: number; amount: number }[];
} {
  try {
    const db = getDb();
    const totals = db
      .prepare(
        `SELECT COUNT(*) AS tenders, COALESCE(SUM(amount),0) AS amount,
          COALESCE(AVG(amount),0) AS average, COUNT(DISTINCT buyer_edrpou) AS buyers,
          COALESCE(SUM(bids_count),0) AS bids
         FROM tenders`,
      )
      .get() as {
      tenders: number;
      amount: number;
      average: number;
      buyers: number;
      bids: number;
    };
    const suppliers = (
      db
        .prepare(`SELECT COUNT(DISTINCT edrpou) AS n FROM participations WHERE role = 'supplier'`)
        .get() as { n: number }
    ).n;
    const savingsRow = db
      .prepare(
        `SELECT COALESCE(SUM(amount - winner_amount),0) AS saved, COALESCE(SUM(amount),0) AS base
         FROM tenders WHERE winner_amount IS NOT NULL AND amount IS NOT NULL AND amount > 0 AND winner_amount > 0`,
      )
      .get() as { saved: number; base: number };
    const byDay = db
      .prepare(
        `SELECT substr(date_created, 1, 10) AS day, COUNT(*) AS count, COALESCE(SUM(amount),0) AS amount
         FROM tenders GROUP BY day ORDER BY day`,
      )
      .all() as unknown as { day: string; count: number; amount: number }[];
    const byRegion = db
      .prepare(
        `SELECT buyer_region AS value, buyer_region AS label, COUNT(*) AS count,
          COALESCE(SUM(amount),0) AS amount
         FROM tenders GROUP BY buyer_region ORDER BY amount DESC LIMIT 12`,
      )
      .all() as unknown as Facet[];
    const byCpv = db
      .prepare(
        `SELECT cpv_section AS value, cpv_section AS label, COUNT(*) AS count,
          COALESCE(SUM(amount),0) AS amount
         FROM tenders WHERE cpv_section <> '' GROUP BY cpv_section ORDER BY amount DESC LIMIT 10`,
      )
      .all() as unknown as Facet[];
    const byStatus = db
      .prepare(
        `SELECT status AS value, status AS label, COUNT(*) AS count, COALESCE(SUM(amount),0) AS amount
         FROM tenders GROUP BY status ORDER BY count DESC`,
      )
      .all() as unknown as Facet[];
    const byMethod = db
      .prepare(
        `SELECT method_type AS value, method_type AS label, COUNT(*) AS count,
          COALESCE(SUM(amount),0) AS amount
         FROM tenders GROUP BY method_type ORDER BY count DESC LIMIT 8`,
      )
      .all() as unknown as Facet[];
    const topBuyers = db
      .prepare(
        `SELECT buyer_edrpou AS edrpou, buyer_name AS name, COUNT(*) AS count,
          COALESCE(SUM(amount),0) AS amount
         FROM tenders WHERE buyer_edrpou <> '' GROUP BY buyer_edrpou ORDER BY amount DESC LIMIT 10`,
      )
      .all() as unknown as { edrpou: string; name: string; count: number; amount: number }[];
    const topSuppliers = db
      .prepare(
        `SELECT p.edrpou AS edrpou, MAX(p.name) AS name, COUNT(DISTINCT p.tender_id) AS count,
          COALESCE(SUM(p.amount),0) AS amount
         FROM participations p WHERE p.role = 'supplier' AND p.status = 'active'
         GROUP BY p.edrpou ORDER BY amount DESC LIMIT 10`,
      )
      .all() as unknown as { edrpou: string; name: string; count: number; amount: number }[];

    return {
      totals: {
        ...totals,
        suppliers,
        savings: savingsRow.saved,
        savingsPct: savingsRow.base ? (savingsRow.saved / savingsRow.base) * 100 : 0,
      },
      byDay,
      byRegion,
      byCpv,
      byStatus,
      byMethod,
      topBuyers,
      topSuppliers,
    };
  } catch {
    return {
      totals: {
        tenders: 0,
        amount: 0,
        average: 0,
        buyers: 0,
        suppliers: 0,
        bids: 0,
        savings: 0,
        savingsPct: 0,
      },
      byDay: [],
      byRegion: [],
      byCpv: [],
      byStatus: [],
      byMethod: [],
      topBuyers: [],
      topSuppliers: [],
    };
  }
}

export function getPriceBenchmarks(): {
  sections: {
    code: string;
    count: number;
    amount: number;
    discount: number;
    avg: number;
  }[];
  overall: { count: number; savings: number; savingsPct: number; avgDiscount: number };
  topCodes: { code: string; name: string; count: number; amount: number; avg: number }[];
} {
  try {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT cpv_section AS code, COUNT(*) AS count, COALESCE(SUM(amount),0) AS amount,
          COALESCE(AVG(amount),0) AS avg,
          COALESCE(AVG(CASE WHEN winner_amount > 0 AND amount > 0
            THEN 1.0 - winner_amount * 1.0 / amount ELSE NULL END), 0) AS discount
         FROM tenders WHERE cpv_section <> '' GROUP BY cpv_section ORDER BY amount DESC`,
      )
      .all() as unknown as {
      code: string;
      count: number;
      amount: number;
      avg: number;
      discount: number;
    }[];
    const overallRow = db
      .prepare(
        `SELECT COUNT(*) AS count, COALESCE(SUM(amount),0) AS base,
          COALESCE(SUM(amount - winner_amount),0) AS savings,
          COALESCE(AVG(CASE WHEN winner_amount > 0 AND amount > 0
            THEN 1.0 - winner_amount * 1.0 / amount ELSE NULL END), 0) AS avgDiscount
         FROM tenders WHERE winner_amount IS NOT NULL AND amount > 0`,
      )
      .get() as { count: number; savings: number; base: number; avgDiscount: number };
    const topCodes = db
      .prepare(
        `SELECT cpv AS code, MAX(cpv_name) AS name, COUNT(*) AS count,
          COALESCE(SUM(amount),0) AS amount, COALESCE(AVG(amount),0) AS avg
         FROM tenders WHERE cpv <> '' GROUP BY cpv ORDER BY amount DESC LIMIT 12`,
      )
      .all() as unknown as {
      code: string;
      name: string;
      count: number;
      amount: number;
      avg: number;
    }[];

    return {
      sections: rows,
      overall: {
        count: overallRow.count,
        savings: overallRow.savings,
        savingsPct: overallRow.base ? (overallRow.savings / overallRow.base) * 100 : 0,
        avgDiscount: overallRow.avgDiscount,
      },
      topCodes,
    };
  } catch {
    return {
      sections: [],
      overall: { count: 0, savings: 0, savingsPct: 0, avgDiscount: 0 },
      topCodes: [],
    };
  }
}

export function getSyncInfo(): { lastSeed: string | null; count: number } {
  try {
    const db = getDb();
    const seed = db.prepare(`SELECT value FROM sync_state WHERE key = 'last_seed'`).get() as
      | { value: string }
      | undefined;
    const count = db.prepare(`SELECT COUNT(*) AS n FROM tenders`).get() as { n: number };
    return { lastSeed: seed?.value || null, count: count.n };
  } catch {
    return { lastSeed: null, count: 0 };
  }
}

export function quickSearch(q: string): {
  tenders: { id: string; tender_id: string; title: string; buyer_name: string; amount: number | null; status: string }[];
  companies: { edrpou: string; name: string; kind: string }[];
} {
  try {
    const db = getDb();
    const query = q.trim().toLowerCase();
    const like = `%${query}%`;
    const tenders = db
      .prepare(
        `SELECT id, tender_id, title, buyer_name, amount, status FROM tenders
         WHERE search_text LIKE ? OR tender_id LIKE ? OR buyer_edrpou LIKE ?
         ORDER BY date_created DESC LIMIT 6`,
      )
      .all(like, `%${q.trim()}%`, `%${q.trim()}%`) as unknown as {
      id: string;
      tender_id: string;
      title: string;
      buyer_name: string;
      amount: number | null;
      status: string;
    }[];
    const companies = db
      .prepare(
        `SELECT edrpou, name, kind FROM companies
         WHERE search_text LIKE ? OR edrpou LIKE ?
         ORDER BY tenders DESC LIMIT 4`,
      )
      .all(like, `%${q.trim()}%`) as unknown as { edrpou: string; name: string; kind: string }[];
    return { tenders, companies };
  } catch {
    return { tenders: [], companies: [] };
  }
}
