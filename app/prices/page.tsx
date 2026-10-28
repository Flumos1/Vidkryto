import Link from "next/link";
import { ArrowUpRight, BadgePercent, CircleDollarSign, Scale, TrendingDown } from "lucide-react";
import { getPriceBenchmarks } from "@/lib/queries";
import { cpvSectionName, formatMoney, formatNumber, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ціни та економія",
  description: "Цінові бенчмарки за категоріями КПВ: середній чек, знижка та економія бюджету.",
};

export default function PricesPage() {
  const data = getPriceBenchmarks();
  const sections = [...data.sections].sort((a, b) => b.discount - a.discount);
  const maxDiscount = Math.max(0.0001, ...sections.map((s) => s.discount));
  const best = sections[0];
  const worst = sections.at(-1);

  return (
    <div className="container-x py-8 lg:py-10">
      <nav className="flex items-center gap-1.5 text-[11.5px] text-muted-2">
        <Link href="/" className="hover:text-ink">
          Головна
        </Link>
        <span>/</span>
        <span className="text-muted">Ціни</span>
      </nav>

      <div className="mt-5 flex flex-col gap-5 border-b border-line pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-[clamp(30px,4vw,44px)] font-semibold tracking-[-0.04em]">
            Ціни та економія
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
            Порівняння очікуваної вартості із ціною переможця за категоріями КПВ. Показує,
            де конкуренція знижує ціну, а де бюджет витрачається без торгу.
          </p>
        </div>
        <Link href="/analytics" className="btn btn-ghost btn-sm">
          Аналітика ринку <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Середня знижка"
          value={formatPercent(data.overall.avgDiscount * 100)}
          sub="між очікуваною та ціною переможця"
          icon={BadgePercent}
          accent
        />
        <Kpi
          label="Зекономлено"
          value={formatMoney(data.overall.savings, { compact: true })}
          sub={`${formatPercent(data.overall.savingsPct)} бюджету`}
          icon={CircleDollarSign}
        />
        <Kpi
          label="Закупівель з результатом"
          value={formatNumber(data.overall.count)}
          sub="є ціна переможця"
          icon={Scale}
        />
        <Kpi
          label="Категорій"
          value={formatNumber(data.sections.length)}
          sub="згруповано за КПВ"
          icon={TrendingDown}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-panel p-6">
          <p className="eyebrow">Найбільша конкуренція</p>
          <p className="mt-3 text-[22px]">{best ? cpvSectionName(best.code) : "—"}</p>
          <p className="mono mt-1 text-[12px] text-muted">
            знижка {best ? formatPercent(best.discount * 100) : "—"} ·{" "}
            {best ? formatNumber(best.count) : 0} закупівель
          </p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-panel-3">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${best ? Math.min(100, best.discount * 300) : 0}%` }}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-6">
          <p className="eyebrow">Найменша конкуренція</p>
          <p className="mt-3 text-[22px]">{worst ? cpvSectionName(worst.code) : "—"}</p>
          <p className="mono mt-1 text-[12px] text-muted">
            знижка {worst ? formatPercent(worst.discount * 100) : "—"} ·{" "}
            {worst ? formatNumber(worst.count) : 0} закупівель
          </p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-panel-3">
            <div
              className="h-full rounded-full bg-warn"
              style={{ width: `${worst ? Math.min(100, 6 + worst.discount * 300) : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-[17px]">Бенчмарки за категоріями</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-panel">
          <table className="table min-w-[720px]">
            <thead>
              <tr>
                <th>Категорія</th>
                <th className="text-right">Закупівель</th>
                <th className="text-right">Обіг</th>
                <th className="text-right">Середній чек</th>
                <th className="w-[220px]">Середня знижка</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((s) => (
                <tr key={s.code}>
                  <td>
                    <Link
                      href={`/tenders?cpv=${s.code}`}
                      className="font-semibold text-ink-soft hover:text-accent"
                    >
                      {cpvSectionName(s.code)}
                    </Link>
                    <span className="mono ml-2 text-[10px] text-muted-2">{s.code}</span>
                  </td>
                  <td className="mono text-right text-[12px]">{formatNumber(s.count)}</td>
                  <td className="mono text-right text-[12px]">{formatMoney(s.amount, { compact: true })}</td>
                  <td className="mono text-right text-[12px]">{formatMoney(s.avg, { compact: true })}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-3">
                        <div
                          className={`h-full rounded-full ${
                            s.discount > 0.08 ? "bg-success" : s.discount > 0.03 ? "bg-accent" : "bg-warn"
                          }`}
                          style={{ width: `${Math.max(3, (s.discount / maxDiscount) * 100)}%` }}
                        />
                      </div>
                      <span className="mono w-12 text-right text-[11px] font-semibold">
                        {formatPercent(s.discount * 100)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {sections.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted">
                    Немає даних для розрахунку.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-[17px]">Топ кодів КПВ за обігом</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.topCodes.map((c) => (
            <Link
              key={c.code}
              href={`/tenders?cpv=${c.code}`}
              className="group rounded-xl border border-line bg-panel p-4 transition-colors hover:border-line-strong"
            >
              <div className="flex items-center justify-between">
                <span className="mono text-[11px] text-accent">{c.code}</span>
                <span className="text-[10px] text-muted-2">{c.count} закупівель</span>
              </div>
              <p className="mt-2 line-clamp-2 text-[12.5px] font-semibold text-ink-soft group-hover:text-accent">
                {c.name}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5 text-[11px]">
                <span className="text-muted-2">середній чек</span>
                <span className="mono font-semibold">{formatMoney(c.avg, { compact: true })}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-8 max-w-3xl text-[11px] leading-relaxed text-muted-2">
        Методика: для кожної закупівлі з відомою ціною переможця розраховується різниця між
        очікуваною вартістю та ціною договору. Показник не враховує зміни специфікацій,
        ПДВ та подальші додаткові угоди. Дані мають ознайомчий характер.
      </p>
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
