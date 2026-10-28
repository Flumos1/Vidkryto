import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getAnalytics, searchTenders } from "@/lib/queries";
import { siteUrl } from "@/lib/site";
import { parseFilters, type RawParams } from "@/lib/params";
import { formatDate, methodLabel, statusMeta } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const format = (searchParams.get("format") || "csv").toLowerCase();
  const stamp = new Date().toISOString().slice(0, 10);

  if (type === "analytics") {
    const a = getAnalytics();
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { Показник: "Закупівель", Значення: a.totals.tenders },
        { Показник: "Обіг, ₴", Значення: a.totals.amount },
        { Показник: "Середній чек, ₴", Значення: a.totals.average },
        { Показник: "Замовників", Значення: a.totals.buyers },
        { Показник: "Постачальників", Значення: a.totals.suppliers },
        { Показник: "Економія, ₴", Значення: a.totals.savings },
        { Показник: "Економія, %", Значення: a.totals.savingsPct },
      ]),
      "KPI",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        a.byDay.map((d) => ({ Дата: d.day, Закупівель: d.count, "Сума, ₴": d.amount })),
      ),
      "Динаміка",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        a.byRegion.map((r) => ({ Регіон: r.label, Закупівель: r.count, "Сума, ₴": r.amount })),
      ),
      "Регіони",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        a.topBuyers.map((b) => ({
          Замовник: b.name,
          ЄДРПОУ: b.edrpou,
          Закупівель: b.count,
          "Сума, ₴": b.amount,
        })),
      ),
      "Замовники",
    );
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="vidkryto-analytics-${stamp}.xlsx"`,
      },
    });
  }

  const params: RawParams = {};
  for (const [key, value] of searchParams.entries()) params[key] = value;
  const filters = parseFilters(params);
  const data = searchTenders({ ...filters, page: 1, perPage: 5000 });

  const rows = data.rows.map((t) => ({
    "ID закупівлі": t.tender_id,
    Назва: t.title,
    Замовник: t.buyer_name,
    "ЄДРПОУ замовника": t.buyer_edrpou,
    Регіон: t.buyer_region,
    Статус: statusMeta(t.status_raw || t.status).label,
    Метод: methodLabel(t.method_type),
    "Очікувана вартість, ₴": t.amount ?? "",
    "Ціна переможця, ₴": t.winner_amount ?? "",
    Переможець: t.winner_name,
    "ЄДРПОУ переможця": t.winner_edrpou,
    Пропозицій: t.bids_count,
    КПВ: t.cpv,
    "Категорія КПВ": t.cpv_name,
    Створено: formatDate(t.date_created),
    Посилання: `${siteUrl}/tenders/${t.id}`,
  }));

  if (format === "xlsx") {
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 24 },
      { wch: 52 },
      { wch: 40 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 32 },
      { wch: 14 },
      { wch: 10 },
      { wch: 14 },
      { wch: 32 },
      { wch: 12 },
      { wch: 46 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Закупівлі");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="vidkryto-tenders-${stamp}.xlsx"`,
      },
    });
  }

  const headers = Object.keys(rows[0] || { "ID закупівлі": "" });
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(";"),
    ...rows.map((row) => headers.map((h) => escape((row as Record<string, unknown>)[h])).join(";")),
  ].join("\r\n");

  return new NextResponse("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vidkryto-tenders-${stamp}.csv"`,
    },
  });
}
