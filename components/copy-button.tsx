"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({
  value,
  label = "Копіювати",
  className = "",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1 text-[11px] font-semibold text-muted transition-colors hover:text-ink ${className}`}
      aria-label={label}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Скопійовано" : label}
    </button>
  );
}
