import { apiError, apiResponse, checkApiKey, clientIp, preflight, rateLimit } from "@/lib/api";
import { getTender } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rl = rateLimit(clientIp(request), 120);
  if (!rl.ok) return apiError("Rate limit exceeded.", 429);
  const key = checkApiKey(request);
  if (!key.valid) return apiError("Invalid API key.", 401);

  const { id } = await params;
  const t = getTender(id);
  if (!t) return apiError("Tender not found.", 404);

  const parse = <T,>(raw: string): T[] => {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? (v as T[]) : [];
    } catch {
      return [];
    }
  };

  return apiResponse({
    data: {
      id: t.id,
      tender_id: t.tender_id,
      title: t.title,
      description: t.description,
      status: t.status,
      status_raw: t.status_raw,
      method_type: t.method_type,
      method: t.method,
      category: t.category,
      amount: t.amount,
      currency: t.currency,
      vat_included: Boolean(t.vat),
      buyer: {
        name: t.buyer_name,
        edrpou: t.buyer_edrpou,
        region: t.buyer_region,
        locality: t.buyer_locality,
        email: t.buyer_email,
      },
      cpv: t.cpv,
      cpv_name: t.cpv_name,
      dates: JSON.parse(t.dates_json || "{}"),
      items: parse(t.items_json),
      bids: parse(t.bids_json),
      awards: parse(t.awards_json),
      documents: parse(t.documents_json),
      complaints: parse(t.complaints_json),
      contracts: parse(t.contracts_json),
      winner: t.winner_name ? { name: t.winner_name, edrpou: t.winner_edrpou, amount: t.winner_amount } : null,
      source_url: `https://prozorro.gov.ua/tender/${t.tender_id}`,
    },
    meta: { source: "ProZorro / Vidkryto", generated_at: new Date().toISOString() },
  });
}
