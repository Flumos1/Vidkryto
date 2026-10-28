"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CornerDownLeft,
  FileSearch,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { formatMoney } from "@/lib/format";

type TenderHit = {
  id: string;
  tender_id: string;
  title: string;
  buyer_name: string;
  amount: number | null;
  status: string;
};

type CompanyHit = {
  edrpou: string;
  name: string;
  kind: string;
};

type Results = { tenders: TenderHit[]; companies: CompanyHit[] };

const QUICK = [
  { label: "Медичне обладнання", href: "/tenders?cpv=33" },
  { label: "Будівництво", href: "/tenders?cpv=45" },
  { label: "IT-послуги", href: "/tenders?cpv=72" },
  { label: "Нафтопродукти", href: "/tenders?cpv=09" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>({ tenders: [], companies: [] });
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
      const target = e.target as HTMLElement;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("open-command", onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("open-command", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 40);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setActive(0);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ tenders: [], companies: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = (await res.json()) as Results;
          setResults(data);
          setActive(0);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") console.error(err);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const flat = useMemo(
    () => [
      ...results.tenders.map((t) => ({ type: "tender" as const, href: `/tenders/${t.id}`, data: t })),
      ...results.companies.map((c) => ({
        type: "company" as const,
        href: `/companies/${c.edrpou}`,
        data: c,
      })),
    ],
    [results],
  );

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (query.trim()) go(`/tenders?q=${encodeURIComponent(query.trim())}`);
      else if (flat[active]) go(flat[active].href);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center px-4 pt-[10vh]">
      <button
        aria-label="Закрити пошук"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Швидкий пошук"
        className="relative w-full max-w-[660px] overflow-hidden rounded-2xl border border-line-strong bg-panel shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-line px-5">
          <Search className="h-[18px] w-[18px] text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Закупівля, ЄДРПОУ, компанія або КПВ…"
            className="h-[58px] w-full bg-transparent text-[15px] outline-none placeholder:text-muted-2"
            autoComplete="off"
            spellCheck={false}
          />
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted" />
          ) : (
            <kbd className="rounded border border-line bg-panel-2 px-1.5 py-0.5 text-[10px] text-muted-2">
              ESC
            </kbd>
          )}
        </div>

        <div className="max-h-[54vh] overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <div className="p-2">
              <p className="eyebrow px-2 py-2">Швидкі переходи</p>
              <div className="grid gap-1">
                {QUICK.map((q) => (
                  <button
                    key={q.href}
                    onClick={() => go(q.href)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink-soft transition-colors hover:bg-panel-2"
                  >
                    <Sparkles className="h-4 w-4 text-accent" />
                    {q.label}
                    <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-2" />
                  </button>
                ))}
              </div>
              <div className="mt-2 grid gap-1">
                <Quick href="/tenders" icon={<FileSearch className="h-4 w-4" />} label="Усі закупівлі" />
                <Quick href="/companies" icon={<Building2 className="h-4 w-4" />} label="Реєстр компаній" />
                <Quick href="/analytics" icon={<Sparkles className="h-4 w-4" />} label="Аналітика ринку" />
              </div>
            </div>
          ) : flat.length === 0 && !loading ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-muted">Нічого не знайдено за «{query}»</p>
              <button
                onClick={() => go(`/tenders?q=${encodeURIComponent(query)}`)}
                className="mt-3 text-sm font-semibold text-accent"
              >
                Шукати серед усіх закупівель →
              </button>
            </div>
          ) : (
            <>
              {results.tenders.length > 0 && (
                <p className="eyebrow px-3 py-2">Закупівлі</p>
              )}
              {results.tenders.map((t) => {
                const idx = flat.findIndex((f) => f.type === "tender" && f.data.id === t.id);
                return (
                  <button
                    key={t.id}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => go(`/tenders/${t.id}`)}
                    className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      active === idx ? "bg-panel-2" : ""
                    }`}
                  >
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent-soft text-accent">
                      <FileSearch className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{t.title}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                        <span className="truncate">{t.buyer_name}</span>
                        <span className="text-muted-2">·</span>
                        <span className="mono">{t.tender_id}</span>
                      </span>
                    </span>
                    <span className="mono shrink-0 text-xs text-muted">
                      {formatMoney(t.amount, { compact: true })}
                    </span>
                  </button>
                );
              })}
              {results.companies.length > 0 && (
                <p className="eyebrow px-3 py-2 pt-3">Компанії</p>
              )}
              {results.companies.map((c) => {
                const idx = flat.findIndex((f) => f.type === "company" && f.data.edrpou === c.edrpou);
                return (
                  <button
                    key={c.edrpou}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => go(`/companies/${c.edrpou}`)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      active === idx ? "bg-panel-2" : ""
                    }`}
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-iris-soft text-iris">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{c.name}</span>
                      <span className="mono text-[11px] text-muted">ЄДРПОУ {c.edrpou}</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-2" />
                  </button>
                );
              })}
              {query.trim() && (
                <button
                  onClick={() => go(`/tenders?q=${encodeURIComponent(query)}`)}
                  className="mt-2 flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm text-muted transition-colors hover:bg-panel-2 hover:text-ink"
                >
                  <Search className="h-4 w-4" />
                  Усі результати за «{query}»
                  <CornerDownLeft className="ml-auto h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-4 border-t border-line bg-panel-2 px-4 py-2 text-[10.5px] text-muted-2">
          <span>↑↓ навігація</span>
          <span>↵ відкрити</span>
          <span className="ml-auto">Дані ProZorro</span>
        </div>
      </div>
    </div>
  );
}

function Quick({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink-soft transition-colors hover:bg-panel-2"
    >
      <span className="text-muted">{icon}</span>
      {label}
    </button>
  );
}
