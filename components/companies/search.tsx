"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";

export function CompanySearch({
  q,
  kind,
  sort,
}: {
  q: string;
  kind: string;
  sort: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(q);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setValue(q);
  }, [q]);

  function update(patch: Record<string, string | undefined>) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [key, v] of Object.entries(patch)) {
      if (!v) p.delete(key);
      else p.set(key, v);
    }
    p.delete("page");
    startTransition(() => router.replace(`${pathname}?${p.toString()}`, { scroll: false }));
  }

  useEffect(() => {
    if (value === q) return;
    const t = setTimeout(() => update({ q: value.trim() || undefined }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Назва компанії або ЄДРПОУ…"
          className="field h-12 pl-11"
          autoComplete="off"
        />
        {pending && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-muted-2">
            пошук…
          </span>
        )}
      </div>
      <div className="relative">
        <select
          value={kind}
          onChange={(e) => update({ kind: e.target.value === "all" ? undefined : e.target.value })}
          className="field h-12 appearance-none pr-9 md:w-[190px]"
          aria-label="Тип компанії"
        >
          <option value="all">Усі компанії</option>
          <option value="supplier">Постачальники</option>
          <option value="buyer">Замовники</option>
          <option value="both">І замовник, і учасник</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
      <div className="relative">
        <select
          value={sort}
          onChange={(e) => update({ sort: e.target.value === "tenders" ? undefined : e.target.value })}
          className="field h-12 appearance-none pr-9 md:w-[180px]"
          aria-label="Сортування"
        >
          <option value="tenders">За активністю</option>
          <option value="amount">За сумою</option>
          <option value="wins">За перемогами</option>
          <option value="name">За назвою</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}
