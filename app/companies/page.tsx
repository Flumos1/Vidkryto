import Link from "next/link";
import { ArrowUpRight, Building2, MapPin, Trophy } from "lucide-react";
import { searchCompanies } from "@/lib/queries";
import { first, type RawParams } from "@/lib/params";
import { formatMoney, formatNumber, initials, timeAgo } from "@/lib/format";
import { CompanySearch } from "@/components/companies/search";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Компанії та ФОП",
  description: "Реєстр замовників і постачальників ProZorro: історія участі, перемоги, суми контрактів.",
};

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const sp = await searchParams;
  const q = first(sp.q) || "";
  const kind = first(sp.kind) || "all";
  const sort = first(sp.sort) || "tenders";
  const page = Math.max(1, Number(first(sp.page) || 1) || 1);
  const data = searchCompanies({ q, kind, sort, page, perPage: 24 });

  const makeHref = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (kind !== "all") p.set("kind", kind);
    if (sort !== "tenders") p.set("sort", sort);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) p.delete(k);
      else p.set(k, v);
    }
    const s = p.toString();
    return `/companies${s ? `?${s}` : ""}`;
  };

  return (
    <div className="container-x py-8 lg:py-10">
      <nav className="flex items-center gap-1.5 text-[11.5px] text-muted-2" aria-label="Хлібні крихти">
        <Link href="/" className="hover:text-ink">
          Головна
        </Link>
        <span>/</span>
        <span className="text-muted">Компанії</span>
      </nav>

      <div className="mt-5 max-w-3xl">
        <h1 className="font-display text-[clamp(30px,4vw,44px)] font-semibold tracking-[-0.04em]">
          Компанії та ФОП
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
          Замовники й учасники закупівель: історія участі, перемоги, суми та географія
          роботи. Пошук за назвою або кодом ЄДРПОУ.
        </p>
      </div>

      <div className="mt-6">
        <Suspense fallback={<div className="h-12 rounded-xl bg-panel-2" />}>
          <CompanySearch q={q} kind={kind} sort={sort} />
        </Suspense>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-[12px] text-muted">
          Знайдено <span className="font-semibold text-ink">{formatNumber(data.total)}</span>{" "}
          компаній
        </p>
        <div className="hidden items-center gap-2 text-[11px] text-muted-2 sm:flex">
          <span className="inline-flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5 text-accent" /> переможці
          </span>
          <span>·</span>
          <span>дані ProZorro</span>
        </div>
      </div>

      {data.rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-line bg-panel py-20 text-center">
          <Building2 className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-4 text-lg font-semibold">Нічого не знайдено</p>
          <p className="mt-1 text-sm text-muted">Спробуйте інший запит або код ЄДРПОУ.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.rows.map((c) => (
            <Link
              key={c.edrpou}
              href={`/companies/${c.edrpou}`}
              className="group relative overflow-hidden rounded-2xl border border-line bg-panel p-5 transition-colors hover:border-line-strong"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[13px] font-extrabold ${
                    c.kind === "buyer"
                      ? "bg-iris-soft text-iris"
                      : c.kind === "both"
                        ? "bg-warn-soft text-warn"
                        : "bg-success-soft text-success"
                  }`}
                >
                  {initials(c.name) || "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-ink-soft transition-colors group-hover:text-accent">
                    {c.name}
                  </p>
                  <p className="mono mt-1 text-[10.5px] text-muted-2">ЄДРПОУ {c.edrpou}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-2 transition-colors group-hover:text-accent" />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3">
                <div>
                  <p className="mono text-[14px] font-semibold">{formatNumber(c.tenders)}</p>
                  <p className="text-[9.5px] uppercase tracking-wide text-muted-2">участей</p>
                </div>
                <div>
                  <p className="mono text-[14px] font-semibold text-accent">{formatNumber(c.wins)}</p>
                  <p className="text-[9.5px] uppercase tracking-wide text-muted-2">перемог</p>
                </div>
                <div>
                  <p className="mono text-[14px] font-semibold">
                    {formatMoney(c.kind === "buyer" ? c.buyer_total : c.total, {
                      compact: true,
                      withSymbol: false,
                    })}
                  </p>
                  <p className="text-[9.5px] uppercase tracking-wide text-muted-2">
                    {c.kind === "buyer" ? "бюджет" : "виграно"}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] text-muted-2">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {c.regions} регіонів · {c.cpvs} категорій
                </span>
                <span>{c.last_date ? timeAgo(c.last_date) : "—"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        <nav className="flex items-center justify-center gap-1" aria-label="Пагінація">
          {data.pages > 1 && (
            <>
              <Link
                href={makeHref({ page: String(Math.max(1, page - 1)) })}
                className={`grid h-9 w-9 place-items-center rounded-full border border-line ${
                  page === 1 ? "pointer-events-none opacity-40" : "hover:bg-panel-2"
                }`}
              >
                ←
              </Link>
              <span className="mono px-3 text-[12px] text-muted">
                {page} / {data.pages}
              </span>
              <Link
                href={makeHref({ page: String(Math.min(data.pages, page + 1)) })}
                className={`grid h-9 w-9 place-items-center rounded-full border border-line ${
                  page === data.pages ? "pointer-events-none opacity-40" : "hover:bg-panel-2"
                }`}
              >
                →
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
