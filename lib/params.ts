import type { TenderFilters } from "./queries";

export type RawParams = Record<string, string | string[] | undefined>;

export function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function num(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

export function parseFilters(params: RawParams): TenderFilters {
  return {
    q: first(params.q)?.slice(0, 120) || undefined,
    status: first(params.status) || undefined,
    region: first(params.region) || undefined,
    cpv: first(params.cpv) || undefined,
    method: first(params.method) || undefined,
    amountMin: num(first(params.amountMin)),
    amountMax: num(first(params.amountMax)),
    from: first(params.from) || undefined,
    to: first(params.to) || undefined,
    sort: first(params.sort) || "date_desc",
    page: Math.max(1, Number(first(params.page) || 1) || 1),
    perPage: Math.min(100, Math.max(1, Number(first(params.perPage) || 20) || 20)),
  };
}

export function filtersToQuery(filters: TenderFilters, overrides: Record<string, string | number | undefined> = {}): string {
  const p = new URLSearchParams();
  const put = (key: string, value: string | number | undefined | null) => {
    if (value !== undefined && value !== null && value !== "") p.set(key, String(value));
  };
  put("q", filters.q);
  put("status", filters.status);
  put("region", filters.region);
  put("cpv", filters.cpv);
  put("method", filters.method);
  put("amountMin", filters.amountMin);
  put("amountMax", filters.amountMax);
  put("from", filters.from);
  put("to", filters.to);
  if (filters.sort && filters.sort !== "date_desc") put("sort", filters.sort);
  if (filters.page && filters.page > 1) put("page", filters.page);
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === "") p.delete(key);
    else p.set(key, String(value));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function countActiveFilters(filters: TenderFilters): number {
  let n = 0;
  if (filters.q) n++;
  if (filters.status) n++;
  if (filters.region) n++;
  if (filters.cpv) n++;
  if (filters.method) n++;
  if (filters.amountMin !== undefined) n++;
  if (filters.amountMax !== undefined) n++;
  if (filters.from) n++;
  if (filters.to) n++;
  return n;
}
