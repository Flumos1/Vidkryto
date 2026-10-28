import Link from "next/link";
import { ArrowUpRight, CircleDollarSign, FileText, Percent, Users } from "lucide-react";
import { getAnalytics, getSyncInfo } from "@/lib/queries";
import { cpvSectionName, formatMoney, formatNumber, formatPercent, methodLabel, statusMeta } from "@/lib/format";
import { AreaChart, BarList, Donut } from "@/components/charts";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Аналітика закупівель",
  description: "Структура витрат, регіони, категорії та економія в публічних закупівлях України.",
};

const STATUS_COLORS: Record<string, string> = {
  active: "var(--accent)",
  complete: "var(--success)",
  cancelled: "var(--danger)",
  unsuccessful: "var(--warn)",
  draft: "var(--muted-2)",
};

export default function AnalyticsPage() {
  const a = getAnalytics();
  const sync = getSyncInfo();
  const t = a.totals;

  const days = a.byDay.map((d) => ({
    label: d.day.slice(8, 10) + "." + d.day.slice(5, 7),
    value: d.amount,
    count: d.count,
  }));

  const statusSlices = a.byStatus
    .filter((s) => s.count > 0)
    .map((s) => ({
      label: statusMeta(s.value).label,
      value: s.count,
      color: STATUS_COLORS[s.value] || "var(--muted-2)",
    }));

  return (
    <div className="container-x py-8 lg:py-10">
      <nav className="flex items-center gap-1.5 text-[11.5px] text-muted-2">
        <Link href="/" className="hover:text-ink">
          Головна
        </Link>
        <span>/</span>
        <span className="text-muted">Аналітика</span>
      </nav>

      <div className="mt-5 flex flex-col gap-5 border-b border-line pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-[clamp(30px,4vw,44px)] font-semibold tracking-[-0.04em]">
            Аналітика ринку
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
            Зріз публічних закупівель за вибіркою {formatNumber(sync.count)} процедур. Дані
            ProZorro, оновлено{" "}
            {sync.lastSeed ? new Date(sync.lastSeed).toLocaleString("uk-UA") : "—"}.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/export?format=xlsx&type=analytics"
            className="btn btn-ghost btn-sm"
          >
            Експорт аналітики
          </a>
          <Link href="/tenders" className="btn btn-primary btn-sm">
            До закупівель <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Загальний обіг"
          value={formatMoney(t.amount, { compact: true })}
          sub={`${formatNumber(t.tenders)} процедур`}
          icon={CircleDollarSign}
          accent
        />
        <Kpi
          label="Середній чек"
          value={formatMoney(t.average, { compact: true })}
          sub="очікувана вартість"
          icon={Percent}
        />
        <Kpi
          label="Замовники / учасники"
          value={`${formatNumber(t.buyers)} / ${formatNumber(t.suppliers)}`}
          sub="унікальних ЄДРПОУ"
          icon={Users}
        />
        <Kpi
          label="Економія бюджету"
          value={formatMoney(t.savings, { compact: true })}
          sub={`${formatPercent(t.savingsPct)} від очікуваної вартості`}
          icon={FileText}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-line bg-panel p-5 lg:p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-[13px] font-bold">Динаміка закупівель</p>
              <p className="mt-0.5 text-[11px] text-muted">очікувана вартість за днями</p>
            </div>
            <span className="rounded-full bg-panel-2 px-2.5 py-1 text-[10px] text-muted">
              {days.length} днів
            </span>
          </div>
          <AreaChart points={days} />
        </div>

        <div className="rounded-2xl border border-line bg-panel p-5 lg:p-6">
          <p className="text-[13px] font-bold">Статуси процедур</p>
          <p className="mt-0.5 text-[11px] text-muted">розподіл за кількістю</p>
          <div className="mt-6">
            <Donut
              slices={statusSlices}
              centerLabel="процедур"
              centerValue={formatNumber(t.tenders, true)}
            />
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-[11px] text-muted">
            <span>Пропозицій подано</span>
            <span className="mono font-semibold text-ink">{formatNumber(t.bids)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Регіони" subtitle="за обігом коштів">
          <BarList
            items={a.byRegion.map((r) => ({
              label: r.label || "Не вказано",
              value: r.amount,
              sub: `${r.count}`,
            }))}
            valueLabel="money"
          />
        </Panel>
        <Panel title="Категорії КПВ" subtitle="за сумою закупівель">
          <BarList
            items={a.byCpv.map((c) => ({
              label: cpvSectionName(c.value),
              value: c.amount,
              sub: c.value,
            }))}
            valueLabel="money"
          />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Топ замовників" subtitle="за сумою закупівель">
          <div className="divide-y divide-line">
            {a.topBuyers.map((b, i) => (
              <Link
                key={b.edrpou}
                href={`/companies/${b.edrpou}`}
                className="flex items-center gap-3 py-3 transition-colors hover:bg-panel-2"
              >
                <span className="mono w-5 text-[11px] text-muted-2">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-ink-soft">{b.name}</p>
                  <p className="mono text-[10px] text-muted-2">
                    ЄДРПОУ {b.edrpou} · {b.count} закупівель
                  </p>
                </div>
                <span className="mono shrink-0 text-[12px] font-semibold">
                  {formatMoney(b.amount, { compact: true })}
                </span>
              </Link>
            ))}
            {a.topBuyers.length === 0 && <p className="py-6 text-center text-[12px] text-muted">Немає даних</p>}
          </div>
        </Panel>

        <Panel title="Топ постачальників" subtitle="за виграними сумами">
          <div className="divide-y divide-line">
            {a.topSuppliers.map((s, i) => (
              <Link
                key={s.edrpou}
                href={`/companies/${s.edrpou}`}
                className="flex items-center gap-3 py-3 transition-colors hover:bg-panel-2"
              >
                <span className="mono w-5 text-[11px] text-muted-2">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-ink-soft">{s.name}</p>
                  <p className="mono text-[10px] text-muted-2">
                    ЄДРПОУ {s.edrpou} · {s.count} перемог
                  </p>
                </div>
                <span className="mono shrink-0 text-[12px] font-semibold text-accent">
                  {formatMoney(s.amount, { compact: true })}
                </span>
              </Link>
            ))}
            {a.topSuppliers.length === 0 && <p className="py-6 text-center text-[12px] text-muted">Немає даних</p>}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel title="Методи закупівель" subtitle="кількість процедур">
          <BarList
            items={a.byMethod.map((m) => ({
              label: methodLabel(m.value),
              value: m.count,
              sub: `${Math.round((m.count / Math.max(1, t.tenders)) * 100)}%`,
            }))}
            valueLabel="number"
          />
        </Panel>

        <div className="rounded-2xl border border-line bg-panel-2 p-6">
          <p className="eyebrow">Як читати дані</p>
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
            Вибірка формується з відкритого API ProZorro і охоплює останні кілька місяців
            процедур. Вона не є повною історією ринку: частина закупівель могла бути
            змінена або видалена першоджерелом. Суми вказані в гривнях без урахування
            інфляції.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-[11px]">
            <div>
              <p className="text-muted-2">Період вибірки</p>
              <p className="mt-1 font-semibold text-ink">
                {a.byDay.length > 0
                  ? `${a.byDay[0].day} — ${a.byDay.at(-1)!.day}`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-2">Середня економія</p>
              <p className="mt-1 font-semibold text-ink">{formatPercent(t.savingsPct)}</p>
            </div>
          </div>
          <Link href="/sources" className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-accent">
            Перелік джерел <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "border-accent/40 bg-panel" : "border-line bg-panel"}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-2">{label}</p>
        <Icon className={`h-4 w-4 ${accent ? "text-accent" : "text-muted-2"}`} />
      </div>
      <p className={`mono mt-3 text-[24px] font-semibold tracking-tight ${accent ? "text-accent" : ""}`}>
        {value}
      </p>
      <p className="mt-1 text-[11px] text-muted">{sub}</p>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-5 lg:p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <p className="text-[13px] font-bold">{title}</p>
        <p className="text-[10.5px] text-muted-2">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
