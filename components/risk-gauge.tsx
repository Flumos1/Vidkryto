export function RiskGauge({
  score,
  level,
  size = 84,
}: {
  score: number;
  level: string;
  size?: number;
}) {
  const color =
    level === "high" ? "var(--danger)" : level === "medium" ? "var(--warn)" : "var(--success)";
  const r = 34;
  const c = 2 * Math.PI * r;
  const filled = (Math.min(100, Math.max(0, score)) / 100) * c;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90">
        <circle cx="42" cy="42" r={r} fill="none" stroke="var(--panel-3)" strokeWidth="8" />
        <circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${filled} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="mono text-[20px] font-semibold leading-none">{score}</span>
        <span className="mt-0.5 text-[8px] uppercase tracking-wider text-muted-2">з 100</span>
      </div>
    </div>
  );
}
