import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  FileText,
  MapPin,
  Percent,
  ShieldAlert,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import {
  getCompany,
  getCompanyCounterparties,
  getCompanyCpv,
  getCompanyTenders,
  getSanctionsMatches,
  getSanctionsStats,
} from "@/lib/queries";
import {
  cpvSectionName,
  formatDate,
  formatMoney,
  formatNumber,
  formatPercent,
  initials,
  statusMeta,
} from "@/lib/format";
import { CopyButton } from "@/components/copy-button";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  buyer: "Замовник",
  supplier: "Постачальник",
  both: "Замовник і постачальник",
};

export async function generateMetadata({ params }: { params: Promise<{ edrpou: string }> }) {
  const { edrpou } = await params;
  const company = getCompany(edrpou);
  return company
    ? { title: company.name, description: `ЄДРПОУ ${edrpou} · історія закупівель ProZorro` }
    : { title: "Компанію не знайдено" };
}

export default async function CompanyPage({ params }: { params: Promise<{ edrpou: string }> }) {
  const { edrpou } = await params;
  const company = getCompany(edrpou);
  if (!company) notFound();

  const tenders = getCompanyTenders(edrpou, 30);
  const cpv = getCompanyCpv(edrpou);
  const counterparties = getCompanyCounterparties(edrpou, 6);
  const sanctions = getSanctionsMatches(company.name);
  const sanctionsStats = getSanctionsStats();
  const winRate = company.tenders ? (company.wins / company.tenders) * 100 : 0;
  const maxCpv = Math.max(1, ...cpv.map((c) => c.amount));

  return (
    <div className="container-x py-8 lg:py-10">
      <Link
        href="/companies"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> До реєстру компаній
      </Link>

      <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-panel">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-accent/[0.05] blur-3xl" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-accent text-[20px] font-extrabold text-accent-fg md:h-20 md:w-20 md:text-[24px]">
                {initials(company.name) || <Building2 />}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-line bg-panel-2 px-2.5 py-0.5 text-[10.5px] font-bold text-muted">
                    {KIND_LABEL[company.kind] || "Компанія"}
                  </span>
                  {company.wins > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-[10.5px] font-bold text-accent">
                      <Trophy className="h-3 w-3" /> {company.wins} перемог
                    </span>
                  )}
                </div>
                <h1 className="mt-2 text-[clamp(22px,3vw,34px)] leading-tight">{company.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-muted">
                  <span className="mono">ЄДРПОУ {company.edrpou}</span>
                  <CopyButton value={company.edrpou} label="Копіювати" />
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {company.regions} регіонів
                  </span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href={`/tenders?q=${company.edrpou}`} className="btn btn-ghost btn-sm">
                <FileText className="h-3.5 w-3.5" /> Закупівлі
              </Link>
              <Link href={`/api/v1/companies/${company.edrpou}`} className="btn btn-primary btn-sm">
                API <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px border-t border-line bg-line md:grid-cols-4">
          {[
            { label: "Участей", value: formatNumber(company.tenders), icon: FileText },
            { label: "Перемог", value: formatNumber(company.wins), icon: Trophy },
            { label: "Сума перемог", value: formatMoney(company.total, { compact: true }), icon: Percent },
            { label: "Win rate", value: formatPercent(winRate), icon: Percent },
          ].map((s) => (
            <div key={s.label} className="bg-panel px-5 py-4">
              <div className="flex items-center gap-1.5 text-muted-2">
                <s.icon className="h-3 w-3" />
                <p className="text-[9.5px] font-bold uppercase tracking-[0.12em]">{s.label}</p>
              </div>
              <p className="mono mt-2 text-[19px] font-semibold">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <h2 className="mb-3 text-[17px]">Історія закупівель</h2>
          <div className="overflow-hidden rounded-2xl border border-line bg-panel">
            {tenders.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-muted">Участей поки немає.</p>
            ) : (
              tenders.map((t) => {
                const meta = statusMeta(t.status_raw || t.status);
                return (
                  <Link
                    key={`${t.id}-${t.role}`}
                    href={`/tenders/${t.id}`}
                    className="group flex flex-col gap-2 border-b border-line p-4 transition-colors last:border-b-0 hover:bg-panel-2 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`badge ${
                            t.role === "supplier"
                              ? "badge-complete"
                              : t.role === "bidder"
                                ? "badge-neutral"
                                : "badge-active"
                          }`}
                        >
                          {t.role === "supplier"
                            ? "переможець"
                            : t.role === "bidder"
                              ? "учасник"
                              : "замовник"}
                        </span>
                        <span className="text-[10px] text-muted-2">{formatDate(t.date_created)}</span>
                      </div>
                      <p className="mt-1.5 line-clamp-1 text-[12.5px] font-semibold text-ink-soft group-hover:text-accent">
                        {t.title}
                      </p>
                      <p className="mt-0.5 truncate text-[10.5px] text-muted-2">{t.buyer_name}</p>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <p className="mono text-[13px] font-semibold">
                        {formatMoney(t.role === "supplier" ? t.role_amount : t.amount, {
                          compact: true,
                        })}
                      </p>
                      <StatusBadge status={t.status} raw={t.status_raw} />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
          <div className="mt-3 text-right">
            <Link
              href={`/tenders?q=${encodeURIComponent(company.edrpou)}`}
              className="text-[12px] font-semibold text-accent"
            >
              Усі закупівлі компанії →
            </Link>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-panel p-5">
            <p className="eyebrow">Структура за КПВ</p>
            <div className="mt-4 space-y-3">
              {cpv.length === 0 && <p className="text-[12px] text-muted">Немає даних.</p>}
              {cpv.map((c) => (
                <div key={c.code}>
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="truncate text-muted">{cpvSectionName(c.code)}</span>
                    <span className="mono shrink-0 text-ink-soft">
                      {formatMoney(c.amount, { compact: true, withSymbol: false })}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel-3">
                    <div
                      className="h-full rounded-full bg-accent/70"
                      style={{ width: `${Math.max(6, (c.amount / maxCpv) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {counterparties.length > 0 && (
            <div className="rounded-2xl border border-line bg-panel p-5">
              <p className="eyebrow">Основні замовники</p>
              <div className="mt-3 space-y-2">
                {counterparties.map((c) => (
                  <Link
                    key={c.edrpou}
                    href={`/companies/${c.edrpou}`}
                    className="block rounded-lg border border-line bg-panel-2 p-2.5 hover:border-line-strong"
                  >
                    <p className="line-clamp-1 text-[11.5px] font-semibold">{c.name}</p>
                    <p className="mono mt-0.5 text-[10px] text-muted-2">
                      {c.count} закупівель · {formatMoney(c.amount, { compact: true })}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div
            className={`rounded-2xl border p-5 ${
              sanctions.length > 0 ? "border-danger/40 bg-danger-soft" : "border-line bg-panel"
            }`}
          >
            <div className="flex items-center gap-2">
              {sanctions.length > 0 ? (
                <ShieldAlert className="h-4 w-4 text-danger" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-success" />
              )}
              <p className="eyebrow">Санкційна перевірка</p>
            </div>
            {sanctions.length > 0 ? (
              <div className="mt-3 space-y-2">
                <p className="text-[12.5px] font-semibold text-danger">
                  Знайдено в переліку санкцій
                </p>
                {sanctions.map((s) => (
                  <a
                    key={s.id}
                    href={s.source_url || "/sanctions"}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="block rounded-lg border border-danger/20 bg-panel/60 p-2.5"
                  >
                    <p className="text-[11.5px] font-semibold text-ink-soft">{s.name}</p>
                    <p className="mt-0.5 text-[10px] text-muted">
                      {s.entity_type === "organization" ? "організація" : "особа"}
                      {s.listed_at ? ` · з ${formatDate(s.listed_at)}` : ""}
                    </p>
                    {s.program && (
                      <p className="mt-1 line-clamp-2 text-[10px] text-muted-2">{s.program}</p>
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[12px] leading-relaxed text-muted">
                Збігів за назвою не знайдено. Це не є юридичним висновком — перевіряйте
                ідентифікатори та першоджерело.
              </p>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <span className="text-[10px] text-muted-2">
                {formatNumber(sanctionsStats.count)} записів
                {sanctionsStats.updatedAt ? ` · ${formatDate(sanctionsStats.updatedAt)}` : ""}
              </span>
              <Link
                href={`/sanctions?q=${encodeURIComponent(company.name)}`}
                className="text-[10.5px] font-semibold text-accent"
              >
                Реєстр →
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-panel-2 p-5 text-[11.5px] leading-relaxed text-muted">
            <p className="mb-2 font-semibold text-ink">Про дані</p>
            Інформація сформована з відкритих даних ProZorro. Компанія може мати інші
            назви або коди — перевіряйте першоджерело.
          </div>
        </aside>
      </div>
    </div>
  );
}
