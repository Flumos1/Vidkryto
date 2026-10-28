import Link from "next/link";
import { Download, FileSpreadsheet, MapPin, Search, Users, X } from "lucide-react";
import { getFacets, searchTenders } from "@/lib/queries";
import { filtersToQuery, first, parseFilters, type RawParams } from "@/lib/params";
import {
  CPV_SECTION_NAMES,
  formatDate,
  formatMoney,
  formatNumber,
  methodLabel,
  statusMeta,
} from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { TenderFiltersPanel } from "@/components/tenders/filters";
import { SaveSearchButton, SortSelect, ViewToggle } from "@/components/tenders/toolbar";
import { Pagination } from "@/components/pagination";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Закупівлі ProZorro",
  description: "Пошук та аналіз публічних закупівель України за назвою, ЄДРПОУ, КПВ, регіоном і сумою.",
};

export default async function TendersPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const view = first(sp.view) === "table" ? "table" : "list";
  const data = searchTenders(filters);
  const facets = getFacets();
  const qs = filtersToQuery(filters);
  const exportBase = qs ? qs.slice(1) : "";

  const chips: { label: string; patch: Partial<typeof filters> }[] = [];
  if (filters.q) chips.push({ label: `«${filters.q}»`, patch: { q: undefined } });
  if (filters.status)
    chips.push({ label: statusMeta(filters.status).label, patch: { status: undefined } });
  if (filters.region) chips.push({ label: filters.region, patch: { region: undefined } });
  if (filters.cpv)
    chips.push({
      label: CPV_SECTION_NAMES[filters.cpv] || `КПВ ${filters.cpv}`,
      patch: { cpv: undefined },
    });
  if (filters.method)
    chips.push({ label: methodLabel(filters.method), patch: { method: undefined } });
  if (filters.amountMin !== undefined)
    chips.push({ label: `від ${formatMoney(filters.amountMin)}`, patch: { amountMin: undefined } });
  if (filters.amountMax !== undefined)
    chips.push({ label: `до ${formatMoney(filters.amountMax)}`, patch: { amountMax: undefined } });
  if (filters.from) chips.push({ label: `з ${filters.from}`, patch: { from: undefined } });
  if (filters.to) chips.push({ label: `по ${filters.to}`, patch: { to: undefined } });

  return (
    <div className="container-x py-8 lg:py-10">
      <nav className="flex items-center gap-1.5 text-[11.5px] text-muted-2" aria-label="Хлібні крихти">
        <Link href="/" className="hover:text-ink">
          Головна
        </Link>
        <span>/</span>
        <span className="text-muted">Закупівлі</span>
      </nav>

      <div className="mt-5 flex flex-col gap-5 border-b border-line pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[clamp(30px,4vw,44px)] font-semibold tracking-[-0.04em]">
              Закупівлі ProZorro
            </h1>
            <span className="mt-1 rounded-full border border-line bg-panel px-2 py-0.5 text-[10.5px] font-bold text-muted">
              LIVE
            </span>
          </div>
          <p className="mt-2 text-[13.5px] text-muted">
            {formatNumber(data.total)} процедур на суму{" "}
            <span className="font-semibold text-ink-soft">
              {formatMoney(data.totals.amount, { compact: true })}
            </span>
            . Пошук за назвою, ЄДРПОУ, КПВ або замовником.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/export?format=csv${exportBase ? `&${exportBase}` : ""}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-panel-2 px-3 text-[12px] font-semibold text-muted hover:border-line-strong hover:text-ink"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </a>
          <a
            href={`/api/export?format=xlsx${exportBase ? `&${exportBase}` : ""}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-panel-2 px-3 text-[12px] font-semibold text-muted hover:border-line-strong hover:text-ink"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </a>
          <Suspense fallback={null}>
            <SaveSearchButton />
          </Suspense>
        </div>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[280px_1fr]">
        <TenderFiltersPanel filters={filters} facets={facets} total={data.total} />

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="mr-auto flex flex-wrap items-center gap-1.5">
              {chips.length === 0 && (
                <span className="text-[12px] text-muted-2">Усі закупівлі за вибраний період</span>
              )}
              {chips.map((c) => (
                <Link
                  key={c.label}
                  href={`/tenders${filtersToQuery({ ...filters, ...c.patch, page: 1 })}`}
                  className="inline-flex h-7 items-center gap-1 rounded-full border border-line bg-panel px-2.5 text-[11px] font-semibold text-ink-soft hover:border-danger/40 hover:text-danger"
                >
                  {c.label}
                  <X className="h-3 w-3" />
                </Link>
              ))}
              {chips.length > 0 && (
                <Link href="/tenders" className="text-[11px] font-semibold text-muted-2 hover:text-ink">
                  очистити
                </Link>
              )}
            </div>
            <Suspense fallback={null}>
              <SortSelect sort={filters.sort || "date_desc"} />
              <ViewToggle view={view} />
            </Suspense>
          </div>

          {data.rows.length === 0 ? (
            <div className="rounded-2xl border border-line bg-panel py-20 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-panel-2">
                <Search className="h-5 w-5 text-muted" />
              </div>
              <p className="mt-4 text-lg font-semibold">Нічого не знайдено</p>
              <p className="mt-1 text-sm text-muted">Спробуйте змінити фільтри або пошуковий запит.</p>
              <Link href="/tenders" className="btn btn-ghost mt-5">
                Скинути фільтри
              </Link>
            </div>
          ) : view === "table" ? (
            <div className="overflow-x-auto rounded-2xl border border-line bg-panel">
              <table className="table min-w-[860px]">
                <thead>
                  <tr>
                    <th>Закупівля</th>
                    <th>Замовник</th>
                    <th>Регіон</th>
                    <th>Статус</th>
                    <th className="text-right">Сума</th>
                    <th>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((t) => (
                    <tr key={t.id} className="row-link">
                      <td className="max-w-[360px]">
                        <Link href={`/tenders/${t.id}`} className="block">
                          <span className="block truncate font-semibold text-ink hover:text-accent">
                            {t.title}
                          </span>
                          <span className="mono mt-1 block text-[10.5px] text-muted-2">
                            {t.tender_id}
                          </span>
                        </Link>
                      </td>
                      <td className="max-w-[220px]">
                        <span className="block truncate text-[12.5px] text-muted">{t.buyer_name}</span>
                      </td>
                      <td className="text-[12px] text-muted">{t.buyer_region}</td>
                      <td>
                        <StatusBadge status={t.status} raw={t.status_raw} />
                      </td>
                      <td className="mono whitespace-nowrap text-right text-[12.5px] font-semibold">
                        {formatMoney(t.amount)}
                      </td>
                      <td className="whitespace-nowrap text-[12px] text-muted">
                        {formatDate(t.date_created)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-line bg-panel">
              {data.rows.map((t) => (
                <Link
                  key={t.id}
                  href={`/tenders/${t.id}`}
                  className="group grid gap-4 border-b border-line p-5 transition-colors last:border-b-0 hover:bg-panel-2 md:grid-cols-[1fr_190px] md:p-6"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={t.status} raw={t.status_raw} />
                      <span className="rounded bg-panel-3 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                        {methodLabel(t.method_type)}
                      </span>
                      <span className="mono text-[10.5px] text-muted-2">{t.tender_id}</span>
                    </div>
                    <h3 className="mt-2.5 line-clamp-2 text-[14.5px] font-semibold leading-snug text-ink-soft transition-colors group-hover:text-accent">
                      {t.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
                      <span className="max-w-[380px] truncate">{t.buyer_name}</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {t.buyer_region}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" /> {t.bids_count} пропозицій
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-line pt-3 md:flex-col md:items-end md:justify-center md:border-l md:border-t-0 md:pl-5 md:pt-0">
                    <div className="md:text-right">
                      <p className="mono text-[16px] font-semibold tracking-tight">
                        {formatMoney(t.amount, { compact: false })}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-2">
                        очікувана вартість
                      </p>
                      {t.winner_name && (
                        <p className="mt-1.5 max-w-[170px] truncate text-[10.5px] text-success">
                          Переможець: {t.winner_name}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-[11px] text-muted-2">{formatDate(t.date_created)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Pagination filters={filters} page={data.page} pages={data.pages} extra={{ view }} />
        </div>
      </div>
    </div>
  );
}
