"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, ExternalLink, Trash2 } from "lucide-react";

type Saved = {
  id: string;
  name: string;
  params_json: string;
  created_at: string;
  last_checked: string | null;
  unread: number;
};

export function SavedSearchList({ items }: { items: Saved[] }) {
  const [rows, setRows] = useState(items);
  const [busy, setBusy] = useState<string | null>(null);

  async function remove(id: string) {
    if (!confirm("Видалити цю підписку?")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/saved-searches/${id}`, { method: "DELETE" });
      if (res.ok) setRows((r) => r.filter((x) => x.id !== id));
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="px-3 py-8 text-center">
        <Bell className="mx-auto h-6 w-6 text-muted-2" />
        <p className="mt-2 text-[12px] text-muted">Ще немає збережених пошуків.</p>
        <Link href="/tenders" className="mt-2 inline-block text-[11.5px] font-semibold text-accent">
          Знайти закупівлі →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {rows.map((s) => (
        <div
          key={s.id}
          className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-panel-2"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-panel-3 text-muted">
            <Bell className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold">{s.name}</p>
            <p className="truncate text-[10px] text-muted-2">
              {s.params_json ? decodeURIComponent(s.params_json) : "усі закупівлі"}
            </p>
          </div>
          {s.unread > 0 && (
            <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-fg">
              {s.unread}
            </span>
          )}
          <Link
            href={`/tenders?${s.params_json}`}
            className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-panel-3 hover:text-ink"
            aria-label="Відкрити пошук"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => remove(s.id)}
            disabled={busy === s.id}
            className="grid h-8 w-8 place-items-center rounded-full text-muted-2 hover:bg-danger-soft hover:text-danger disabled:opacity-40"
            aria-label="Видалити підписку"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
