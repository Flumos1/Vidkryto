"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bookmark, Check, ChevronDown, LayoutList, Rows3 } from "lucide-react";

export function SortSelect({ sort }: { sort: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function change(value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value === "date_desc") p.delete("sort");
    else p.set("sort", value);
    p.delete("page");
    startTransition(() => router.replace(`${pathname}?${p.toString()}`, { scroll: false }));
  }

  return (
    <div className="relative">
      <select
        value={sort}
        onChange={(e) => change(e.target.value)}
        className="h-9 appearance-none rounded-full border border-line bg-panel-2 pl-3 pr-8 text-[12px] font-semibold text-ink outline-none"
        aria-label="Сортування"
        disabled={pending}
      >
        <option value="date_desc">Спочатку нові</option>
        <option value="date_asc">Спочатку старі</option>
        <option value="amount_desc">Більша сума</option>
        <option value="amount_asc">Менша сума</option>
        <option value="bids_desc">Більше пропозицій</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
    </div>
  );
}

export function ViewToggle({ view }: { view: "list" | "table" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function set(next: "list" | "table") {
    const p = new URLSearchParams(searchParams.toString());
    if (next === "list") p.delete("view");
    else p.set("view", next);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center rounded-full border border-line bg-panel-2 p-0.5">
      <button
        onClick={() => set("list")}
        className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${
          view === "list" ? "bg-panel-3 text-ink" : "text-muted hover:text-ink"
        }`}
        aria-label="Списком"
        aria-pressed={view === "list"}
      >
        <LayoutList className="h-4 w-4" />
      </button>
      <button
        onClick={() => set("table")}
        className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${
          view === "table" ? "bg-panel-3 text-ink" : "text-muted hover:text-ink"
        }`}
        aria-label="Таблицею"
        aria-pressed={view === "table"}
      >
        <Rows3 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function SaveSearchButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setState("saving");
    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: new URLSearchParams(searchParams.toString()).get("q") || "Мій пошук",
          params: searchParams.toString(),
        }),
      });
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/tenders?${searchParams.toString()}`)}`);
        return;
      }
      if (!res.ok) throw new Error("failed");
      setState("saved");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  }

  return (
    <button
      onClick={save}
      disabled={state === "saving"}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-panel-2 px-3 text-[12px] font-semibold text-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-60"
      title="Зберегти цей пошук"
    >
      {state === "saved" ? (
        <>
          <Check className="h-3.5 w-3.5 text-success" /> Збережено
        </>
      ) : (
        <>
          <Bookmark className="h-3.5 w-3.5" />
          {state === "saving" ? "Зберігаю…" : state === "error" ? "Помилка" : "Зберегти"}
        </>
      )}
    </button>
  );
}
