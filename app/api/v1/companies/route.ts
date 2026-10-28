import { apiError, apiResponse, checkApiKey, clientIp, preflight, rateLimit } from "@/lib/api";
import { searchCompanies } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

export async function GET(request: Request) {
  const rl = rateLimit(clientIp(request), 120);
  if (!rl.ok) return apiError("Rate limit exceeded.", 429);
  const key = checkApiKey(request);
  if (!key.valid) return apiError("Invalid API key.", 401);

  const { searchParams } = new URL(request.url);
  const data = searchCompanies({
    q: searchParams.get("q") || undefined,
    kind: searchParams.get("kind") || undefined,
    sort: searchParams.get("sort") || undefined,
    page: Number(searchParams.get("page") || 1) || 1,
    perPage: Math.min(100, Number(searchParams.get("perPage") || 24) || 24),
  });

  return apiResponse({
    data: data.rows.map((c) => ({
      edrpou: c.edrpou,
      name: c.name,
      kind: c.kind,
      tenders: c.tenders,
      wins: c.wins,
      total_amount: c.total,
      regions: c.regions,
      cpv_categories: c.cpvs,
      risk_score: c.risk_score,
      risk_level: c.risk_level,
      last_activity: c.last_date,
      url: `/companies/${c.edrpou}`,
    })),
    meta: { total: data.total, page: data.page, pages: data.pages, source: "ProZorro / Vidkryto" },
  });
}
