"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export function MarkReadButton() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  async function mark() {
    await fetch("/api/notifications", { method: "POST" });
    setDone(true);
    router.refresh();
  }

  return (
    <button
      onClick={mark}
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
    >
      <CheckCircle2 className="h-3 w-3" />
      {done ? "Готово" : "Прочитати все"}
    </button>
  );
}
