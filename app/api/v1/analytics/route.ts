import { apiError, apiResponse, checkApiKey, clientIp, preflight, rateLimit } from "@/lib/api";
import { getAnalytics } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

export async function GET(request: Request) {
  const rl = rateLimit(clientIp(request), 60);
  if (!rl.ok) return apiError("Rate limit exceeded.", 429);
  const key = checkApiKey(request);
  if (!key.valid) return apiError("Invalid API key.", 401);

  const a = getAnalytics();
  return apiResponse({
    data: {
      totals: a.totals,
      by_day: a.byDay,
      by_region: a.byRegion.map((r) => ({ region: r.label, count: r.count, amount: r.amount })),
      by_cpv: a.byCpv.map((c) => ({ section: c.value, count: c.count, amount: c.amount })),
      by_status: a.byStatus.map((s) => ({ status: s.value, count: s.count, amount: s.amount })),
      top_buyers: a.topBuyers,
      top_suppliers: a.topSuppliers,
    },
    meta: { source: "ProZorro / Vidkryto", generated_at: new Date().toISOString() },
  });
}
