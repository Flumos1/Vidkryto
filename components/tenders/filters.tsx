"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import type { Facet, TenderFilters } from "@/lib/queries";
import { countActiveFilters, filtersToQuery } from "@/lib/params";
import { CPV_SECTION_NAMES, methodLabel } from "@/lib/format";

type Props = {
  filters: TenderFilters;
  facets: {
    regions: Facet[];
    statuses: Facet[];
    cpvs: Facet[];
    methods: Facet[];
  };
  total: number;
};

const STATUS_OPTIONS = [
  { value: "", label: "Усі" },
  { value: "active", label: "Активні" },
  { value: "complete", label: "Завершені" },
  { value: "cancelled", label: "Скасовані" },
  { value: "unsuccessful", label: "Не відбулися" },
];

export function TenderFiltersPanel({ filters, facets, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(filters.q ?? "");
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(filters.amountMin ? String(filters.amountMin) : "");
  const [max, setMax] = useState(filters.amountMax ? String(filters.amountMax) : "");

  const activeCount = countActiveFilters(filters);

  const update = (patch: Partial<TenderFilters>) => {
    const next = { ...filters, ...patch };
    if (!("page" in patch)) next.page = 1;
    startTransition(() => {
      router.replace(`${pathname}${filtersToQuery(next)}`, { scroll: false });
    });
  };

  useEffect(() => {
    const current = filters.q ?? "";
    if (q === current) return;
    const timer = setTimeout(() => update({ q: q.trim() || undefined }), 380);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    setMin(filters.amountMin ? String(filters.amountMin) : "");
    setMax(filters.amountMax ? String(filters.amountMax) : "");
  }, [filters.amountMin, filters.amountMax]);

  const statusCounts = useMemo(() => {
    const map = new Map(facets.statuses.map((s) => [s.value, s.count]));
    return map;
  }, [facets.statuses]);

  const body = (
    <div className="space-y-6">
      <div>
        <label className="label" htmlFor="q">
          Пошук
        </label>
        <input
          id="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Назва, ЄДРПОУ, КПВ…"
          className="field"
          autoComplete="off"
        />
      </div>

      <div>
        <span className="label">Статус</span>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => update({ status: s.value || undefined })}
              className="chip h-7 text-[11.5px]"
              data-active={(filters.status || "") === s.value}
            >
              {s.label}
              {s.value && statusCounts.get(s.value) ? (
                <span className="opacity-60">{statusCounts.get(s.value)}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="region">
          Регіон
        </label>
        <div className="relative">
          <select
            id="region"
            value={filters.region || ""}
            onChange={(e) => update({ region: e.target.value || undefined })}
            className="field appearance-none pr-9"
          >
            <option value="">Уся Україна</option>
            {facets.regions
              .filter((r) => r.value && r.value !== "Не вказано")
              .map((r) => (
                <option key={r.value} value={r.value}>
                  {r.value} ({r.count})
                </option>
              ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="cpv">
          Категорія КПВ
        </label>
        <div className="relative">
          <select
            id="cpv"
            value={filters.cpv || ""}
            onChange={(e) => update({ cpv: e.target.value || undefined })}
            className="field appearance-none pr-9"
          >
            <option value="">Усі категорії</option>
            {facets.cpvs.map((c) => (
              <option key={c.value} value={c.value}>
                {CPV_SECTION_NAMES[c.value] || "Інше"} ({c.value})
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="method">
          Метод закупівлі
        </label>
        <div className="relative">
          <select
            id="method"
            value={filters.method || ""}
            onChange={(e) => update({ method: e.target.value || undefined })}
            className="field appearance-none pr-9"
          >
            <option value="">Усі методи</option>
            {facets.methods
              .filter((m) => m.value)
              .map((m) => (
                <option key={m.value} value={m.value}>
                  {methodLabel(m.value)} ({m.count})
                </option>
              ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
      </div>

      <div>
        <span className="label">Сума, ₴</span>
        <div className="flex items-center gap-2">
          <input
            value={min}
            onChange={(e) => setMin(e.target.value)}
            onBlur={() => update({ amountMin: min ? Number(min) : undefined })}
            onKeyDown={(e) => e.key === "Enter" && update({ amountMin: min ? Number(min) : undefined })}
            placeholder="від"
            inputMode="numeric"
            className="field"
          />
          <span className="text-muted-2">—</span>
          <input
            value={max}
            onChange={(e) => setMax(e.target.value)}
            onBlur={() => update({ amountMax: max ? Number(max) : undefined })}
            onKeyDown={(e) => e.key === "Enter" && update({ amountMax: max ? Number(max) : undefined })}
            placeholder="до"
            inputMode="numeric"
            className="field"
          />
        </div>
      </div>

      <div>
        <span className="label">Дата створення</span>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={filters.from || ""}
            onChange={(e) => update({ from: e.target.value || undefined })}
            className="field px-2 text-[12px]"
            aria-label="Від"
          />
          <input
            type="date"
            value={filters.to || ""}
            onChange={(e) => update({ to: e.target.value || undefined })}
            className="field px-2 text-[12px]"
            aria-label="До"
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line pt-4">
        <a
          href="/tenders"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted hover:text-ink"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Скинути
        </a>
        <span className="mono text-[11px] text-muted-2">
          {pending ? "оновлення…" : `${total} результатів`}
        </span>
      </div>
    </div>
  );

  return (
    <>
      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn-ghost w-full lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Фільтри
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-fg">
              {activeCount}
            </span>
          )}
        </button>

        <aside className="hidden lg:block">
          <div className="sticky top-[88px] rounded-2xl border border-line bg-panel p-5">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-[13px] font-bold">Фільтри</p>
              {activeCount > 0 && (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">
                  {activeCount}
                </span>
              )}
            </div>
            {body}
          </div>
        </aside>
      </div>

      {open && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button
            aria-label="Закрити фільтри"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-3xl border-t border-line bg-panel p-5">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-base font-bold">Фільтри</p>
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-line"
                aria-label="Закрити"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {body}
            <button onClick={() => setOpen(false)} className="btn btn-primary mt-5 w-full">
              Показати {total}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
