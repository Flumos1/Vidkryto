"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, Loader2, Plus } from "lucide-react";

type ApiKey = { id: string; name: string; created_at: string; requests: number };

export function ApiKeyPanel({ keys }: { keys: ApiKey[] }) {
  const [items, setItems] = useState(keys);
  const [newKey, setNewKey] = useState<{ key: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function create() {
    setLoading(true);
    try {
      const res = await fetch("/api/api-keys", { method: "POST" });
      const data = (await res.json()) as { key?: string; id?: string; error?: string };
      if (res.ok && data.key) {
        setNewKey({ key: data.key, name: "Особистий ключ" });
        setItems((p) => [
          ...p,
          {
            id: data.id || "new",
            name: "Особистий ключ",
            created_at: new Date().toISOString(),
            requests: 0,
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-2xl border border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="flex items-center gap-2 text-[14px] font-bold">
          <KeyRound className="h-4 w-4 text-accent" /> API-ключі
        </h2>
        <button
          onClick={create}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-full border border-line bg-panel-2 px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-ink disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Створити
        </button>
      </div>

      <div className="p-4">
        {newKey && (
          <div className="mb-4 rounded-lg border border-accent/40 bg-accent-soft p-3">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-accent">
              Ключ створено — збережіть його
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="mono min-w-0 flex-1 truncate rounded bg-panel px-2 py-1.5 text-[11px]">
                {newKey.key}
              </code>
              <button
                onClick={copy}
                className="grid h-8 w-8 place-items-center rounded-md border border-line bg-panel text-muted hover:text-ink"
                aria-label="Копіювати ключ"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <p className="py-4 text-center text-[11.5px] text-muted">
            Ключів ще немає. Створіть, щоб користуватися API.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((k) => (
              <div key={k.id} className="flex items-center gap-3 rounded-lg border border-line bg-panel-2 p-2.5">
                <KeyRound className="h-3.5 w-3.5 text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-semibold">{k.name}</p>
                  <p className="mono text-[10px] text-muted-2">
                    {new Date(k.created_at).toLocaleDateString("uk-UA")} · {k.requests} запитів
                  </p>
                </div>
                <span className="rounded bg-success-soft px-1.5 py-0.5 text-[9.5px] font-bold text-success">
                  active
                </span>
              </div>
            ))}
          </div>
        )}

        <a
          href="/api-docs"
          className="mt-3 block text-center text-[10.5px] font-semibold text-accent"
        >
          Документація API →
        </a>
      </div>
    </div>
  );
}
