import { formatMoney, formatNumber } from "@/lib/format";

export function AreaChart({
  points,
  height = 220,
  format = "money",
}: {
  points: { label: string; value: number }[];
  height?: number;
  format?: "money" | "number";
}) {
  if (points.length === 0) {
    return <div className="grid h-[220px] place-items-center text-[12px] text-muted">Немає даних</div>;
  }
  const width = 900;
  const padX = 8;
  const padTop = 16;
  const padBottom = 26;
  const innerH = height - padTop - padBottom;
  const max = Math.max(1, ...points.map((p) => p.value));
  const step = points.length > 1 ? (width - padX * 2) / (points.length - 1) : 0;
  const coords = points.map((p, i) => ({
    x: padX + i * step,
    y: padTop + innerH - (p.value / max) * innerH,
  }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords.at(-1)!.x.toFixed(1)},${padTop + innerH} L${coords[0].x.toFixed(1)},${
    padTop + innerH
  } Z`;
  const tickIdx = [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Динаміка показника"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={0}
            x2={width}
            y1={padTop + innerH * f}
            y2={padTop + innerH * f}
            stroke="var(--line)"
            strokeDasharray="3 5"
          />
        ))}
        <path d={area} fill="url(#areaFill)" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={points.length > 40 ? 0.8 : 2.5} fill="var(--accent)">
            <title>{`${points[i].label}: ${
              format === "money"
                ? formatMoney(points[i].value, { compact: true })
                : formatNumber(points[i].value)
            }`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[9.5px] text-muted-2">
        {tickIdx.map((i) => (
          <span key={i}>{points[i]?.label}</span>
        ))}
      </div>
    </div>
  );
}

export function Donut({
  slices,
  centerLabel,
  centerValue,
}: {
  slices: { label: string; value: number; color: string }[];
  centerLabel: string;
  centerValue: string;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = 54;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-[140px] w-[140px] shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--panel-3)" strokeWidth="16" />
          {slices.map((s) => {
            const len = (s.value / total) * c;
            const el = (
              <circle
                key={s.label}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="16"
                strokeDasharray={`${Math.max(0, len - 2)} ${c}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="mono text-[19px] font-semibold">{centerValue}</span>
          <span className="text-[9px] uppercase tracking-wider text-muted-2">{centerLabel}</span>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-[11.5px]">
            <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="truncate text-muted">{s.label}</span>
            <span className="mono ml-auto shrink-0 font-semibold">{s.value}</span>
            <span className="w-9 shrink-0 text-right text-[10px] text-muted-2">
              {Math.round((s.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BarList({
  items,
  valueLabel,
  max: maxOverride,
}: {
  items: { label: string; value: number; sub?: string; href?: string }[];
  valueLabel: "money" | "number";
  max?: number;
}) {
  const max = maxOverride || Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) {
    return <p className="py-6 text-center text-[12px] text-muted">Немає даних</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-[12px]">
            <span className="truncate text-muted" title={item.label}>
              {item.label}
            </span>
            <span className="mono shrink-0 font-semibold text-ink-soft">
              {valueLabel === "money"
                ? formatMoney(item.value, { compact: true })
                : formatNumber(item.value)}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-3">
              <div
                className="h-full rounded-full bg-accent/75"
                style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
              />
            </div>
            {item.sub && <span className="w-14 text-right text-[9.5px] text-muted-2">{item.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
