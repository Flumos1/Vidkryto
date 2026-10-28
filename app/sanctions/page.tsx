import Link from "next/link";
import { ArrowUpRight, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { getSanctionsStats, searchSanctions } from "@/lib/queries";
import { first, type RawParams } from "@/lib/params";
import { formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Санкційні списки",
  description:
    "Перелік осіб і організацій, пов'язаних з тероризмом або щодо яких застосовано міжнародні санкції.",
};

export default async function SanctionsPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const sp = await searchParams;
  const q = first(sp.q) || "";
  const type = first(sp.type) || "";
  const page = Math.max(1, Number(first(sp.page) || 1) || 1);
  const stats = getSanctionsStats();
  const data = searchSanctions({ q, type, page, perPage: 40 });

  const makeHref = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (type) p.set("type", type);
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "") p.delete(key);
      else p.set(key, value);
    }
    const s = p.toString();
    return `/sanctions${s ? `?${s}` : ""}`;
  };

  return (
    <div className="container-x py-8 lg:py-10">
      <nav className="flex items-center gap-1.5 text-[11.5px] text-muted-2">
        <Link href="/" className="hover:text-ink">
          Головна
        </Link>
        <span>/</span>
        <span className="text-muted">Санкційні списки</span>
      </nav>

      <div className="mt-5 flex flex-col gap-5 border-b border-line pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-[clamp(30px,4vw,44px)] font-semibold tracking-[-0.04em]">
            Санкційні списки
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
            Особи та організації, пов&apos;язані з терористичною діяльністю або щодо яких
            застосовано міжнародні санкції. Дані Держфінмоніторингу через портал
            data.gov.ua.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 text-[11px] text-muted">
            <ShieldAlert className="h-3.5 w-3.5 text-warn" />
            {formatNumber(stats.count)} записів
          </span>
          <a
            href="https://data.gov.ua/dataset/30442100-2b7a-4d69-8816-8e3dd5da2492"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 rounded-full border border-line bg-panel px-3 py-1.5 text-[11px] font-semibold text-accent"
          >
            Джерело <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      <form action="/sanctions" className="mt-6 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Ім'я, назва організації або псевдонім…"
            className="field h-12 pl-11"
            autoComplete="off"
          />
        </div>
        <div className="flex gap-2">
          <select name="type" defaultValue={type} className="field h-12 md:w-[190px]">
            <option value="">Усі типи</option>
            <option value="organization">Організації</option>
            <option value="person">Фізичні особи</option>
          </select>
          <button type="submit" className="btn btn-primary h-12">
            Знайти
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href="/sanctions"
          className="chip"
          data-active={!type}
        >
          Усі · {formatNumber(stats.count)}
        </Link>
        <Link
          href="/sanctions?type=organization"
          className="chip"
          data-active={type === "organization"}
        >
          Організації · {formatNumber(stats.organizations)}
        </Link>
        <Link
          href="/sanctions?type=person"
          className="chip"
          data-active={type === "person"}
        >
          Особи · {formatNumber(stats.persons)}
        </Link>
        <span className="ml-auto text-[10.5px] text-muted-2">
          Оновлено: {stats.updatedAt ? formatDate(stats.updatedAt) : "—"}
        </span>
      </div>

      {data.rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-line bg-panel py-16 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-success" />
          <p className="mt-3 text-[15px] font-semibold">Збігів не знайдено</p>
          <p className="mt-1 text-[12px] text-muted">
            Спробуйте інший запит або перевірте написання імені.
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-panel">
          {data.rows.map((row, i) => (
            <div
              key={row.id}
              className={`p-4 md:p-5 ${i > 0 ? "border-t border-line" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`badge ${
                        row.entity_type === "organization" ? "badge-unsuccessful" : "badge-neutral"
                      }`}
                    >
                      {row.entity_type === "organization" ? "організація" : "особа"}
                    </span>
                    {row.listed_at && (
                      <span className="text-[10.5px] text-muted-2">
                        у переліку з {formatDate(row.listed_at)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[14px] font-semibold text-ink-soft">{row.name}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
                    {row.country && <span>{row.country}</span>}
                    {row.dob && <span>н. {row.dob}</span>}
                    {row.program && <span className="max-w-full truncate">{row.program}</span>}
                  </div>
                </div>
                <a
                  href={row.source_url || "#"}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="shrink-0 text-[10.5px] font-semibold text-accent"
                >
                  Першоджерело ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.pages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-3 text-[12px]" aria-label="Пагінація">
          <Link
            href={makeHref({ page: String(Math.max(1, page - 1)) })}
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
            href={makeHref({ page: String(Math.min(data.pages, page + 1)) })}
            className={`rounded-full border border-line px-3 py-1.5 ${
              page === data.pages ? "pointer-events-none opacity-40" : "hover:bg-panel-2"
            }`}
          >
            Далі →
          </Link>
        </nav>
      )}

      <div className="mt-8 rounded-2xl border border-line bg-panel-2 p-5 text-[11px] leading-relaxed text-muted">
        <p className="font-semibold text-ink">Важливо</p>
        <p className="mt-1">
          Перелік є публічним, але не є юридичним висновком. Збіг за назвою не означає
          тотожності компанії — перевіряйте ідентифікатори та першоджерело. Дані
          оновлюються окремим імпортом і можуть відставати від офіційного реєстру.
        </p>
        <p className="mt-2">
          Офіційний перелік:{" "}
          <a
            href="https://fiu.gov.ua/assets/userfiles/Terror/BlackListFull.xml"
            target="_blank"
            rel="noreferrer noopener"
            className="text-accent"
          >
            Держфінмоніторинг (XML)
          </a>
          .
        </p>
      </div>
    </div>
  );
}
