import { apiError, apiResponse, checkApiKey, clientIp, preflight, rateLimit } from "@/lib/api";
import { getCompany, getCompanyCounterparties, getCompanyCpv, getCompanyRelations, getCompanyTenders } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

export async function GET(request: Request, { params }: { params: Promise<{ edrpou: string }> }) {
  const rl = rateLimit(clientIp(request), 120);
  if (!rl.ok) return apiError("Rate limit exceeded.", 429);
  const key = checkApiKey(request);
  if (!key.valid) return apiError("Invalid API key.", 401);

  const { edrpou } = await params;
  const company = getCompany(edrpou);
  if (!company) return apiError("Company not found.", 404);

  const tenders = getCompanyTenders(edrpou, 25);
  const cpv = getCompanyCpv(edrpou);
  const counterparties = getCompanyCounterparties(edrpou, 10);
  const relations = getCompanyRelations(edrpou, 10);

  return apiResponse({
    data: {
      edrpou: company.edrpou,
      name: company.name,
      kind: company.kind,
      stats: {
        tenders: company.tenders,
        wins: company.wins,
        total_won: company.total,
        regions: company.regions,
        cpv_categories: company.cpvs,
        win_rate: company.tenders ? (company.wins / company.tenders) * 100 : 0,
        risk_score: company.risk_score,
        risk_level: company.risk_level,
        risk_factors: (() => {
          try {
            return JSON.parse(company.risk_factors_json || "[]");
          } catch {
            return [];
          }
        })(),
      },
      cpv_breakdown: cpv.map((c) => ({ section: c.code, count: c.count, amount: c.amount })),
      top_buyers: counterparties,
      relations,
      recent_tenders: tenders.map((t) => ({
        id: t.id,
        tender_id: t.tender_id,
        title: t.title,
        role: t.role,
        amount: t.role === "supplier" ? t.role_amount : t.amount,
        status: t.status,
        date: t.date_created,
      })),
    },
    meta: { source: "ProZorro / Vidkryto" },
  });
}
