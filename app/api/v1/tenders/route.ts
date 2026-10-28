import { apiError, apiResponse, checkApiKey, clientIp, preflight, rateLimit } from "@/lib/api";
import { getFacets, searchTenders } from "@/lib/queries";
import { parseFilters, type RawParams } from "@/lib/params";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

export async function GET(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit(ip, 120);
  if (!rl.ok) return apiError("Rate limit exceeded. 120 requests per minute.", 429);

  const key = checkApiKey(request);
  if (!key.valid) return apiError("Invalid API key.", 401);

  const { searchParams } = new URL(request.url);
  const params: RawParams = {};
  for (const [k, v] of searchParams.entries()) params[k] = v;
  const filters = parseFilters(params);
  const perPage = Math.min(100, Math.max(1, Number(searchParams.get("perPage") || 20) || 20));
  const page = Math.max(1, Number(searchParams.get("page") || filters.page || 1) || 1);

  const data = searchTenders({ ...filters, page, perPage });

  return apiResponse({
    data: data.rows.map((t) => ({
      id: t.id,
      tender_id: t.tender_id,
      title: t.title,
      status: t.status,
      status_raw: t.status_raw,
      method_type: t.method_type,
      amount: t.amount,
      currency: t.currency,
      vat_included: Boolean(t.vat),
      buyer: {
        name: t.buyer_name,
        edrpou: t.buyer_edrpou,
        region: t.buyer_region,
        locality: t.buyer_locality,
      },
      cpv: t.cpv,
      cpv_name: t.cpv_name,
      bids: t.bids_count,
      winner: t.winner_name ? { name: t.winner_name, edrpou: t.winner_edrpou } : null,
      winner_amount: t.winner_amount,
      date_created: t.date_created,
      date_modified: t.date_modified,
      url: `/tenders/${t.id}`,
    })),
    meta: {
      total: data.total,
      page: data.page,
      pages: data.pages,
      per_page: data.perPage,
      amount_total: data.totals.amount,
      rate_limit_remaining: rl.remaining,
      source: "ProZorro / Vidkryto",
    },
    facets: searchParams.get("facets") === "1" ? getFacets() : undefined,
  });
}
