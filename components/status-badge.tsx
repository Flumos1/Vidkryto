import { statusMeta } from "@/lib/format";

export function StatusBadge({
  status,
  raw,
  className = "",
}: {
  status: string;
  raw?: string | null;
  className?: string;
}) {
  const meta = statusMeta(raw || status);
  return (
    <span className={`badge badge-${meta.tone} ${className}`} title={meta.hint}>
      <span
        className="h-1.5 w-1.5 rounded-full bg-current"
        style={{ opacity: meta.tone === "neutral" ? 0.5 : 1 }}
      />
      {meta.label}
    </span>
  );
}
