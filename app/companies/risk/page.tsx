import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Download, ShieldAlert, SlidersHorizontal } from "lucide-react";
import {
  getFacets,
  getRiskOverview,
  searchRiskCompanies,
  type CompanyRow,
} from "@/lib/queries";
import { first, type RawParams } from "@/lib/params";
import { CPV_SECTION_NAMES, formatDate, formatMoney, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ризикові компанії",
  description:
    "Постачальники з підвищеним ризиком: санкції, рішення АМКУ, єдині заявки, концентрація та цінові відхилення.",
};

function factors(row: CompanyRow): { label: string; value: string; points: number }[] {
  try {
    const parsed = JSON.parse(row.risk_factors_json || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default async function RiskCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const sp = await searchParams;
  const q = first(sp.q) || "";
  const risk = first(sp.risk) || "";
  const region = first(sp.region) || "";
  const cpv = first(sp.cpv) || "";
  const minWins = Number(first(sp.minWins) || 0) || 0;
  const page = Math.max(1, Number(first(sp.page) || 1) || 1);

  const data = searchRiskCompanies({ q, risk, region, cpv, minWins, page, perPage: 30 });
  const overview = getRiskOverview();
  const facets = getFacets();
  const qs = (extra: Record<string, string | undefined> = {}) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (risk) p.set("risk", risk);
    if (region) p.set("region", region);
    if (cpv) p.set("cpv", cpv);
    if (minWins) p.set("minWins", String(minWins));
    for (const [key, value] of Object.entries(extra)) {
      if (value === undefined || value === "") p.delete(key);
      else p.set(key, value);
    }
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="container-x py-8 lg:py-10">
      <nav className="flex items-center gap-1.5 text-[11.5px] text-muted-2">
        <Link href="/companies" className="hover:text-ink">
          Компанії
        </Link>
        <span>/</span>
        <span className="text-muted">Ризикові</span>
      </nav>

      <div className="mt-5 flex flex-col gap-5 border-b border-line pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-[clamp(30px,4vw,44px)] font-semibold tracking-[-0.04em]">
            Ризикові компанії
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
            Постачальники з підвищеним ризик-профілем за відкритими ознаками: санкції,
            рішення АМКУ, перемоги з єдиною заявкою, концентрація та цінові відхилення.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/export?type=risk&format=csv${qs().replace(/^\?/, "&")}`} className="btn btn-ghost btn-sm">
            <Download className="h-3.5 w-3.5" /> CSV
          </a>
          <a href={`/api/export?type=risk&format=xlsx${qs().replace(/^\?/, "&")}`} className="btn btn-ghost btn-sm">
            <Download className="h-3.5 w-3.5" /> Excel
          </a>
          <Link href="/companies" className="btn btn-primary btn-sm">
            <ArrowLeft className="h-3.5 w-3.5" /> Реєстр
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-danger/40 bg-danger-soft p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-danger">
            Високий ризик
          </p>
          <p className="mono mt-3 text-[26px] font-semibold">{formatNumber(overview.high)}</p>
          <p className="mt-1 text-[11px] text-muted">компаній</p>
        </div>
        <div className="rounded-2xl border border-warn/40 bg-warn-soft p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-warn">
            Середній ризик
          </p>
          <p className="mono mt-3 text-[26px] font-semibold">{formatNumber(overview.medium)}</p>
          <p className="mt-1 text-[11px] text-muted">компаній</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-2">
            Сума перемог (high)
          </p>
          <p className="mono mt-3 text-[26px] font-semibold">
            {formatMoney(overview.highAmount, { compact: true })}
          </p>
          <p className="mt-1 text-[11px] text-muted">за весь період</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-2">
            Перевірено постачальників
          </p>
          <p className="mono mt-3 text-[26px] font-semibold">{formatNumber(overview.suppliers)}</p>
          <p className="mt-1 text-[11px] text-muted">у вибірці</p>
        </div>
      </div>

      <form
        action="/companies/risk"
        className="mt-6 grid gap-3 rounded-2xl border border-line bg-panel p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
      >
        <div className="relative">
          <SlidersHorizontal className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Назва або ЄДРПОУ"
            className="field h-11 pl-10"
            autoComplete="off"
          />
        </div>
        <select name="risk" defaultValue={risk} className="field h-11">
          <option value="">Всі рівні</option>
          <option value="high">Високий</option>
          <option value="medium">Середній</option>
        </select>
        <select name="region" defaultValue={region} className="field h-11">
          <option value="">Всі регіони</option>
          {facets.regions
            .filter((r) => r.value && r.value !== "Не вказано")
            .map((r) => (
              <option key={r.value} value={r.value}>
                {r.value}
              </option>
            ))}
        </select>
        <select name="cpv" defaultValue={cpv} className="field h-11">
          <option value="">Всі КПВ</option>
          {facets.cpvs.map((c) => (
            <option key={c.value} value={c.value}>
              {CPV_SECTION_NAMES[c.value] || c.value}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            name="minWins"
            defaultValue={minWins || ""}
            placeholder="Мін. перемог"
            className="field h-11 w-[120px]"
            inputMode="numeric"
          />
          <button type="submit" className="btn btn-primary h-11">
            Фільтр
          </button>
        </div>
      </form>

      <div className="mt-4 flex items-center justify-between text-[11.5px] text-muted">
        <span>
          Знайдено <span className="font-semibold text-ink">{formatNumber(data.total)}</span> компаній
        </span>
        {(q || risk || region || cpv || minWins) && (
          <Link href="/companies/risk" className="font-semibold text-accent">
            Скинути фільтри
          </Link>
        )}
      </div>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-panel">
        <table className="table min-w-[980px]">
          <thead>
            <tr>
              <th>Компанія</th>
              <th>Ризик</th>
              <th>Фактори</th>
              <th className="text-right">Перемог</th>
              <th className="text-right">Сума</th>
              <th>Остання</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((company) => {
              const list = factors(company);
              const high = company.risk_level === "high";
              return (
                <tr key={company.edrpou} className="row-link">
                  <td>
                    <Link href={`/companies/${company.edrpou}`} className="block">
                      <span className="block max-w-[360px] truncate font-semibold text-ink hover:text-accent">
                        {company.name}
                      </span>
                      <span className="mono mt-0.5 block text-[10.5px] text-muted-2">
                        ЄДРПОУ {company.edrpou}
                      </span>
                    </Link>
                  </td>
                  <td>
                    <span className={`badge ${high ? "badge-cancelled" : "badge-unsuccessful"}`}>
                      <ShieldAlert className="h-3 w-3" />
                      {company.risk_score} / 100
                    </span>
                  </td>
                  <td>
                    <div className="flex max-w-[280px] flex-wrap gap-1">
                      {list.length === 0 && <span className="text-[11px] text-muted-2">—</span>}
                      {list.slice(0, 3).map((f) => (
                        <span
                          key={f.label}
                          className="rounded bg-panel-3 px-1.5 py-0.5 text-[9.5px] text-muted"
                          title={`${f.value} (+${f.points})`}
                        >
                          {f.label}
                        </span>
                      ))}
                      {list.length > 3 && (
                        <span className="text-[9.5px] text-muted-2">+{list.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="mono text-right text-[12px]">{formatNumber(company.wins)}</td>
                  <td className="mono text-right text-[12px]">
                    {formatMoney(company.total, { compact: true })}
                  </td>
                  <td className="whitespace-nowrap text-[11px] text-muted">
                    {company.last_date ? formatDate(company.last_date) : "—"}
                  </td>
                </tr>
              );
            })}
            {data.rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-14 text-center text-muted">
                  За цими фільтрами нічого не знайдено.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data.pages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-3 text-[12px]" aria-label="Пагінація">
          <Link
            href={`/companies/risk${qs({ page: String(Math.max(1, page - 1)) })}`}
            className={`rounded-full border border-line px-3 py-1.5 ${
              page === 1 ? "pointer-events-none opacity-40" : "hover:bg-panel-2"
            }`}
          >
            ← Назад
          </Link>
          <span className="mono text-muted">
            {page} / {data.pages}
          </span>
          <Link
            href={`/companies/risk${qs({ page: String(Math.min(data.pages, page + 1)) })}`}
            className={`rounded-full border border-line px-3 py-1.5 ${
              page === data.pages ? "pointer-events-none opacity-40" : "hover:bg-panel-2"
            }`}
          >
            Далі →
          </Link>
        </nav>
      )}

      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-line bg-panel-2 p-5 text-[11px] leading-relaxed text-muted">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
        <p>
          Ризик-профіль — індикатор за відкритими даними, а не доказ порушення. Рішення
          АМКУ можуть бути оскаржені, збіг у санкційних списках потребує перевірки
          ідентифікаторів. Методика: санкції +40, АМКУ до +25, єдині заявки до +20,
          концентрація до +10, ціна до +15.
        </p>
      </div>
    </div>
  );
}
