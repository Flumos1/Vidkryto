import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  FileText,
  MapPin,
  MessageSquare,
  Receipt,
  Scale,
  Users,
} from "lucide-react";
import { getRelatedTenders, getTender } from "@/lib/queries";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatPercent,
  methodLabel,
  pluralize,
  statusMeta,
} from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { CopyButton } from "@/components/copy-button";

export const dynamic = "force-dynamic";

type Item = {
  id?: string;
  description: string;
  quantity: number | null;
  unit: string;
  cpv: string;
  cpvName: string;
  region: string;
};

type Supplier = {
  name: string;
  edrpou: string;
  region: string;
  locality: string;
  email: string;
  phone: string;
};

type Award = {
  id: string;
  status: string;
  date: string;
  value: number | null;
  suppliers: Supplier[];
  documents: { title: string; url: string; type: string; date: string }[];
};

type Bid = {
  id: string;
  status: string;
  date: string;
  value: number | null;
  tenderers: Supplier[];
};

type Doc = { title: string; url: string; type: string; format: string; date: string };

function bidStatus(status: string): string {
  const map: Record<string, string> = {
    active: "Допущено",
    pending: "На розгляді",
    unsuccessful: "Відхилено",
    cancelled: "Скасовано",
    deleted: "Видалено",
    draft: "Чернетка",
  };
  return map[status] || status;
}

function docFormat(doc: Doc): string {
  const ext = doc.title.split(".").pop()?.toUpperCase();
  if (ext && ext.length <= 4 && /^[A-Z0-9]+$/.test(ext) && doc.title.includes(".")) return ext;
  const mime = (doc.format || "").toLowerCase();
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("sheet") || mime.includes("excel")) return "XLSX";
  if (mime.includes("word") || mime.includes("document")) return "DOCX";
  if (mime.includes("zip")) return "ZIP";
  if (mime.includes("png")) return "PNG";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "JPG";
  return (doc.type || "файл").toUpperCase();
}

function parseArray<T>(json: string): T[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function parseDates(json: string): {
  created?: string;
  modified?: string;
  tenderPeriod?: { startDate?: string; endDate?: string };
  enquiryPeriod?: { startDate?: string; endDate?: string };
  auctionPeriod?: { startDate?: string; endDate?: string };
  awardPeriod?: { startDate?: string; endDate?: string };
} {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tender = getTender(id);
  if (!tender) return { title: "Закупівлю не знайдено" };
  return {
    title: tender.title,
    description: `${tender.buyer_name} · ${formatMoney(tender.amount)} · ${tender.tender_id}`,
  };
}

export default async function TenderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tender = getTender(id);
  if (!tender) notFound();

  const items = parseArray<Item>(tender.items_json);
  const awards = parseArray<Award>(tender.awards_json);
  const bids = parseArray<Bid>(tender.bids_json);
  const documents = parseArray<Doc>(tender.documents_json);
  const complaints = parseArray<{ id: string; status: string; title: string; date: string }>(
    tender.complaints_json,
  );
  const dates = parseDates(tender.dates_json);
  const related = getRelatedTenders(tender);
  const meta = statusMeta(tender.status_raw || tender.status);

  const savings =
    tender.amount && tender.winner_amount
      ? Math.max(0, tender.amount - tender.winner_amount)
      : null;
  const savingsPct =
    savings !== null && tender.amount ? (savings / tender.amount) * 100 : null;

  const timeline = [
    { label: "Оприлюднено", date: dates.created || tender.date_created, tone: "done" },
    {
      label: "Прийом пропозицій",
      date: dates.tenderPeriod?.startDate,
      end: dates.tenderPeriod?.endDate,
      tone: "done",
    },
    { label: "Аукціон", date: dates.auctionPeriod?.startDate, tone: "pending" },
    { label: "Кваліфікація переможця", date: dates.awardPeriod?.startDate, tone: "pending" },
    { label: "Останнє оновлення", date: dates.modified || tender.date_modified, tone: "done" },
  ].filter((e) => e.date);

  return (
    <div className="container-x py-8 lg:py-10">
      <Link
        href="/tenders"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> До всіх закупівель
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <div className="relative overflow-hidden rounded-2xl border border-line bg-panel p-6 md:p-8">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-accent/[0.05] blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={tender.status} raw={tender.status_raw} />
                <span className="rounded bg-panel-3 px-2 py-1 text-[10.5px] font-semibold text-muted">
                  {methodLabel(tender.method_type)}
                </span>
                <span className="text-[11px] text-muted-2">{meta.hint}</span>
              </div>

              <h1 className="mt-4 text-[clamp(23px,3vw,34px)] leading-[1.12]">{tender.title}</h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-muted">
                <Link
                  href={tender.buyer_edrpou ? `/companies/${tender.buyer_edrpou}` : "/companies"}
                  className="max-w-full truncate font-semibold text-ink-soft hover:text-accent"
                >
                  {tender.buyer_name}
                </Link>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {tender.buyer_locality || tender.buyer_region}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" /> {formatDate(tender.date_created)}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                <span className="mono text-[11px] text-muted-2">{tender.tender_id}</span>
                <CopyButton value={tender.tender_id} label="Копіювати ID" />
                <CopyButton value={`${process.env.SITE_URL || "http://localhost:3000"}/tenders/${tender.id}`} label="Копіювати посилання" />
                <a
                  href={`https://prozorro.gov.ua/tender/${tender.tender_id}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-accent"
                >
                  ProZorro <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Fact label="Очікувана вартість" value={formatMoney(tender.amount)} icon={CircleDollarSign} />
            <Fact
              label="Пропозицій"
              value={`${tender.bids_count} ${pluralize(tender.bids_count, "пропозиція", "пропозиції", "пропозицій")}`}
              icon={Users}
            />
            <Fact
              label="Економія"
              value={savings !== null ? formatMoney(savings) : "—"}
              hint={savingsPct !== null ? `${formatPercent(savingsPct)} від бюджету` : undefined}
              icon={Scale}
            />
          </div>

          {tender.description && (
            <Section title="Опис">
              <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-muted">
                {tender.description}
              </p>
            </Section>
          )}

          <Section
            title={`Позиції${items.length ? ` · ${items.length}` : ""}`}
            action={
              <a
                href={`/api/v1/tenders/${tender.id}`}
                target="_blank"
                className="text-[11px] font-semibold text-accent"
              >
                JSON →
              </a>
            }
          >
            {items.length === 0 ? (
              <Empty text="Позиції не вказані в цій процедурі." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="table min-w-[620px]">
                  <thead>
                    <tr>
                      <th>Опис</th>
                      <th>КПВ</th>
                      <th className="text-right">Кількість</th>
                      <th>Регіон</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={item.id || i}>
                        <td>
                          <span className="block max-w-[380px] text-[12.5px] text-ink-soft">
                            {item.description}
                          </span>
                        </td>
                        <td>
                          <span className="mono text-[11px] text-muted">{item.cpv}</span>
                          <span className="mt-0.5 block max-w-[220px] truncate text-[10.5px] text-muted-2">
                            {item.cpvName}
                          </span>
                        </td>
                        <td className="mono whitespace-nowrap text-right text-[12px]">
                          {item.quantity ?? "—"} {item.unit}
                        </td>
                        <td className="text-[11.5px] text-muted">{item.region}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="Учасники та результат">
            {awards.length === 0 && bids.length === 0 ? (
              <Empty text="Пропозиції ще не подані." />
            ) : (
              <div className="space-y-4">
                {awards.length > 0 && (
                  <div>
                    <p className="eyebrow mb-2">Рішення про переможця</p>
                    <div className="space-y-2">
                      {awards.map((award) => (
                        <div
                          key={award.id}
                          className="rounded-xl border border-line bg-panel-2 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle2
                                className={`h-4 w-4 ${
                                  award.status === "active" ? "text-success" : "text-muted"
                                }`}
                              />
                              <span className="text-[12.5px] font-semibold">
                                {award.status === "active"
                                  ? "Визначено переможця"
                                  : award.status === "unsuccessful"
                                    ? "Не допущено"
                                    : "Очікує рішення"}
                              </span>
                            </div>
                            <span className="mono text-[13px] font-semibold">
                              {formatMoney(award.value)}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {award.suppliers.map((s, i) => (
                              <Link
                                key={`${s.edrpou}-${i}`}
                                href={`/companies/${s.edrpou}`}
                                className="group rounded-lg border border-line bg-panel px-3 py-2"
                              >
                                <p className="truncate text-[12px] font-semibold group-hover:text-accent">
                                  {s.name}
                                </p>
                                <p className="mono mt-0.5 text-[10.5px] text-muted-2">
                                  ЄДРПОУ {s.edrpou || "—"}
                                </p>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bids.length > 0 && (
                  <div>
                    <p className="eyebrow mb-2">Подані пропозиції · {bids.length}</p>
                    <div className="overflow-hidden rounded-xl border border-line">
                      {bids.map((bid, i) => (
                        <div
                          key={bid.id}
                          className={`flex flex-wrap items-center justify-between gap-3 p-3.5 ${
                            i > 0 ? "border-t border-line" : ""
                          }`}
                        >
                          <div className="min-w-0">
                            {bid.tenderers.map((s, j) => (
                              <Link
                                key={`${s.edrpou}-${j}`}
                                href={`/companies/${s.edrpou}`}
                                className="block truncate text-[12.5px] font-semibold hover:text-accent"
                              >
                                {s.name}
                              </Link>
                            ))}
                            <p className="mono mt-0.5 text-[10.5px] text-muted-2">
                              {bid.tenderers.map((s) => s.edrpou).filter(Boolean).join(", ") ||
                                "ЄДРПОУ не вказано"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="mono text-[12.5px] font-semibold">{formatMoney(bid.value)}</p>
                            <p className="text-[10px] text-muted-2">{bidStatus(bid.status)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Section>

          {documents.length > 0 && (
            <Section title={`Документи · ${documents.length}`}>
              <div className="grid gap-2 sm:grid-cols-2">
                {documents.map((doc, i) => (
                  <a
                    key={`${doc.url}-${i}`}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex items-start gap-3 rounded-xl border border-line bg-panel-2 p-3 transition-colors hover:border-line-strong"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-panel-3 text-muted">
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-[12px] font-semibold text-ink-soft group-hover:text-accent">
                        {doc.title}
                      </span>
                      <span className="mt-1 block text-[10px] uppercase text-muted-2">
                        {docFormat(doc)} · {formatDate(doc.date)}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            </Section>
          )}

          {complaints.length > 0 && (
            <Section title={`Скарги · ${complaints.length}`}>
              <div className="space-y-2">
                {complaints.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-lg border border-line p-3">
                    <MessageSquare className="h-4 w-4 text-warn" />
                    <span className="text-[12.5px]">{c.title || "Скарга"}</span>
                    <span className="ml-auto text-[10.5px] text-muted-2">{c.status}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title="Хронологія">
            <div className="relative pl-5">
              <span className="absolute bottom-2 left-[5px] top-2 w-px bg-line" />
              {timeline.map((event, i) => (
                <div key={i} className="relative pb-5 last:pb-0">
                  <span
                    className={`absolute -left-5 top-1 h-2.5 w-2.5 rounded-full border-2 ${
                      event.tone === "done"
                        ? "border-success bg-success"
                        : "border-line-strong bg-panel"
                    }`}
                  />
                  <p className="text-[12.5px] font-semibold">{event.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {formatDateTime(event.date)}
                    {event.end ? ` — ${formatDate(event.end)}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-4 lg:sticky lg:top-[88px] lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-line bg-panel">
            <div className="border-b border-line bg-panel-2 px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-2">
                Бюджет закупівлі
              </p>
              <p className="mono mt-2 text-[28px] font-semibold tracking-tight">
                {formatMoney(tender.amount)}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                {tender.vat ? "з ПДВ" : "без ПДВ"} · {tender.currency}
              </p>
            </div>
            <dl className="divide-y divide-line text-[12px]">
              <Row label="Переможець" value={tender.winner_name || "Не визначено"} />
              <Row label="Ціна переможця" value={formatMoney(tender.winner_amount)} />
              <Row
                label="Економія"
                value={savingsPct !== null ? `${formatPercent(savingsPct)}` : "—"}
                tone={savingsPct && savingsPct > 0 ? "success" : undefined}
              />
              <Row label="Пропозицій" value={String(tender.bids_count)} />
              <Row label="Документів" value={String(tender.docs_count)} />
              <Row label="Категорія" value={tender.cpv_name} />
            </dl>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-5">
            <p className="eyebrow">Замовник</p>
            <Link
              href={tender.buyer_edrpou ? `/companies/${tender.buyer_edrpou}` : "/companies"}
              className="mt-2 block text-[13px] font-semibold leading-snug hover:text-accent"
            >
              {tender.buyer_name}
            </Link>
            <p className="mono mt-1 text-[11px] text-muted-2">
              ЄДРПОУ {tender.buyer_edrpou || "—"}
            </p>
            {tender.buyer_email && (
              <a
                href={`mailto:${tender.buyer_email}`}
                className="mt-2 block truncate text-[11px] text-muted hover:text-ink"
              >
                {tender.buyer_email}
              </a>
            )}
            <div className="mt-4 space-y-2 border-t border-line pt-4">
              <Link
                href={`/tenders?region=${encodeURIComponent(tender.buyer_region)}`}
                className="flex items-center gap-2 text-[11.5px] text-muted hover:text-ink"
              >
                <MapPin className="h-3.5 w-3.5" /> Інші закупівлі регіону
              </Link>
              <Link
                href={`/tenders?cpv=${tender.cpv_section}`}
                className="flex items-center gap-2 text-[11.5px] text-muted hover:text-ink"
              >
                <Receipt className="h-3.5 w-3.5" /> Схожі категорії
              </Link>
              <Link
                href={`/analytics`}
                className="flex items-center gap-2 text-[11.5px] text-muted hover:text-ink"
              >
                <Scale className="h-3.5 w-3.5" /> Аналітика ринку
              </Link>
            </div>
          </div>

          <a
            href={`/api/v1/tenders/${tender.id}`}
            target="_blank"
            className="flex items-center justify-between rounded-2xl border border-line bg-panel-2 px-5 py-4 text-[12px] font-semibold text-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            API · JSON закупівлі
            <ArrowUpRight className="h-4 w-4" />
          </a>

          <p className="px-1 text-[10.5px] leading-relaxed text-muted-2">
            Дані з ProZorro, оновлено {formatDateTime(tender.date_modified)}. Сервіс не є
            офіційним джерелом.
          </p>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-[22px]">Схожі закупівлі</h2>
            <Link href={`/tenders?cpv=${tender.cpv_section}`} className="text-[12px] font-semibold text-accent">
              Більше →
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/tenders/${r.id}`}
                className="group rounded-xl border border-line bg-panel p-4 transition-colors hover:border-line-strong"
              >
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={r.status} raw={r.status_raw} />
                  <span className="text-[10px] text-muted-2">{formatDate(r.date_created)}</span>
                </div>
                <p className="mt-3 line-clamp-2 text-[12.5px] font-semibold leading-snug text-ink-soft group-hover:text-accent">
                  {r.title}
                </p>
                <p className="mono mt-3 text-[12px] text-muted">{formatMoney(r.amount, { compact: true })}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Fact({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="flex items-center gap-2 text-muted-2">
        <Icon className="h-3.5 w-3.5" />
        <p className="text-[10px] font-bold uppercase tracking-[0.1em]">{label}</p>
      </div>
      <p className="mono mt-2 text-[17px] font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-[10.5px] text-success">{hint}</p>}
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[17px]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3">
      <dt className="text-muted">{label}</dt>
      <dd
        className={`max-w-[190px] text-right font-semibold ${
          tone === "success" ? "text-success" : "text-ink-soft"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-5 py-10 text-center text-[12.5px] text-muted">
      {text}
    </div>
  );
}
