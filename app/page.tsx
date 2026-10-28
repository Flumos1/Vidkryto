import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  Code2,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { getHomeStats } from "@/lib/queries";
import { formatMoney, formatNumber, statusMeta, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const stats = getHomeStats();
  const maxHour = Math.max(1, ...stats.hourly.map((h) => h.count));
  const live = stats.recent.slice(0, 4);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="hero-halo absolute inset-0" />
          <div className="grid-lines absolute inset-0 opacity-40" />
        </div>

        <div className="container-x grid grid-cols-1 gap-14 pb-20 pt-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-center lg:gap-10 lg:pb-24 lg:pt-20">
          <div className="min-w-0 fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/70 px-3 py-1.5 text-[11.5px] font-semibold text-muted backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="pulse-dot absolute inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              Аналітика ProZorro у реальному часі
              <span className="text-muted-2">·</span>
              <span className="text-ink">140+ реєстрів</span>
            </div>

            <h1 className="mt-7 font-display text-[clamp(30px,3.7vw,50px)] font-semibold leading-[1.06] tracking-[-0.045em]">
              Кожна гривня
              <br />
              <span className="text-accent">під наглядом.</span>
            </h1>

            <p className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-muted">
              Пошук закупівель, цінові бенчмарки, перевірка контрагентів і аналітика
              витрат — на основі відкритих даних ProZorro та державних реєстрів.
            </p>

            <form action="/tenders" className="mt-8 max-w-xl" role="search">
              <div className="group flex items-center gap-2 rounded-2xl border border-line-strong bg-panel p-2 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.9)] transition-colors focus-within:border-accent">
                <Search className="ml-2 h-5 w-5 shrink-0 text-muted" />
                <input
                  name="q"
                  placeholder="Що шукаємо? Назва, ЄДРПОУ або КПВ…"
                  className="h-11 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-2"
                  aria-label="Пошук закупівель"
                  autoComplete="off"
                />
                <button type="submit" className="btn btn-primary h-11 shrink-0">
                  Знайти
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-2">
                Популярне
              </span>
              {[
                { cpv: "33", label: "Медицина" },
                { cpv: "45", label: "Будівництво" },
                { cpv: "72", label: "IT" },
                { cpv: "09", label: "Паливо" },
                { cpv: "85", label: "Охорона здоров'я" },
              ].map((c) => (
                <Link key={c.cpv} href={`/tenders?cpv=${c.cpv}`} className="chip">
                  {c.label}
                </Link>
              ))}
            </div>

            <dl className="mt-10 grid grid-cols-1 max-w-xl divide-y divide-line border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <Stat label="Закупівлі у базі" value={formatNumber(stats.tenders)} />
              <Stat label="Обіг" value={formatMoney(stats.totalAmount, { compact: true })} accent />
              <Stat label="Замовники" value={formatNumber(stats.buyers)} />
            </dl>
          </div>

          {/* LIVE CONSOLE */}
          <div className="fade-up fade-up-2 relative min-w-0">
            <div className="absolute -inset-6 -z-10 rounded-[36px] bg-accent/[0.06] blur-3xl" />
            <div className="overflow-hidden rounded-2xl border border-line-strong bg-panel shadow-2xl">
              <div className="flex items-center justify-between border-b border-line bg-panel-2 px-5 py-3.5">
                <div className="flex items-center gap-2 text-[12px] font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="pulse-dot absolute inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  <span className="text-ink">LIVE · ProZorro</span>
                </div>
                <span className="mono text-[10.5px] text-muted-2">
                  оновлено {stats.recent[0] ? timeAgo(stats.recent[0].date_modified) : "—"}
                </span>
              </div>

              <div className="divide-y divide-line">
                {live.length === 0 && (
                  <div className="px-5 py-10 text-center text-sm text-muted">
                    Немає даних. Запустіть <code className="mono text-accent">npm run seed</code>.
                  </div>
                )}
                {live.map((t) => {
                  const meta = statusMeta(t.status_raw || t.status);
                  return (
                    <Link
                      key={t.id}
                      href={`/tenders/${t.id}`}
                      className="group block px-5 py-3.5 transition-colors hover:bg-panel-2"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-ink-soft group-hover:text-ink">
                            {t.title}
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-muted">
                            <span className="truncate">{t.buyer_name}</span>
                            <span className="text-muted-2">·</span>
                            <span>{t.buyer_region}</span>
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="mono text-[12.5px] font-semibold">
                            {formatMoney(t.amount, { compact: true })}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-2">{meta.label}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="border-t border-line bg-panel-2 px-5 py-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-2">
                      Активність за годинами
                    </p>
                    <p className="mt-1 text-[11px] text-muted">кількість нових процедур</p>
                  </div>
                  <p className="mono text-[11px] text-muted">
                    {stats.hourly.reduce((s, h) => s + h.count, 0)} подій
                  </p>
                </div>
                <div className="mt-4 flex h-16 items-end gap-1.5">
                  {stats.hourly.length === 0 && <div className="h-full w-full rounded bg-panel-3" />}
                  {stats.hourly.map((h) => (
                    <div key={h.hour} className="group relative flex-1">
                      <div
                        className="w-full rounded-sm bg-gradient-to-t from-accent/25 to-accent transition-all group-hover:from-accent/40"
                        style={{ height: `${Math.max(6, (h.count / maxHour) * 60)}px` }}
                      />
                      <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] font-semibold text-bg group-hover:block">
                        {h.count}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[9.5px] text-muted-2">
                  <span>{stats.hourly[0]?.hour.slice(11) || ""}:00</span>
                  <span>зараз</span>
                </div>
              </div>
            </div>

            <div className="absolute -right-3 -top-3 hidden rotate-3 rounded-xl border border-line bg-panel px-3 py-2 shadow-xl sm:block">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-2">
                <Sparkles className="h-3 w-3 text-accent" /> у стрічці
              </p>
              <p className="mono mt-0.5 text-[13px] font-semibold text-ink">
                {formatNumber(stats.tenders)} закупівель
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SOURCE STRIP */}
      <section className="border-y border-line bg-bg-soft py-4">
        <div className="container-x flex flex-wrap items-center justify-between gap-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-2">
            Джерела даних
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] font-semibold text-muted">
            <span>ProZorro</span>
            <span className="text-muted-2">/</span>
            <span>ProZorro.Продажі</span>
            <span className="text-muted-2">/</span>
            <span>ЄДР</span>
            <span className="text-muted-2">/</span>
            <span>data.gov.ua</span>
            <span className="text-muted-2">/</span>
            <span>Санкційні списки</span>
            <span className="hidden text-muted-2 sm:inline">/</span>
            <Link href="/sources" className="hidden text-ink link-underline sm:inline">
              усі 140+
            </Link>
          </div>
        </div>
      </section>

      {/* KPI BAND */}
      <section className="container-x py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Закупівель у вибірці", value: formatNumber(stats.tenders), note: "живий потік ProZorro" },
            { label: "Загальний обіг", value: formatMoney(stats.totalAmount, { compact: true }), note: "очікувана вартість" },
            { label: "Компаній у реєстрі", value: formatNumber(stats.companies), note: "замовники й учасники" },
            { label: "Регіонів", value: formatNumber(stats.regions), note: "від Закарпаття до Луганщини" },
          ].map((k) => (
            <div key={k.label} className="bg-panel p-6 lg:p-7">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-2">
                {k.label}
              </p>
              <p className="mt-3 font-display text-[30px] font-semibold tracking-[-0.03em] lg:text-[34px]">
                {k.value}
              </p>
              <p className="mt-1.5 text-[11.5px] text-muted">{k.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BENTO */}
      <section className="container-x pb-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Платформа</p>
            <h2 className="mt-3 max-w-xl text-[clamp(28px,4vw,44px)]">
              Не просто цифри.
              <br />
              <span className="text-muted">Інструменти для рішень.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Від пошуку окремої закупівлі до макроаналітики ринку — все в одному робочому
            просторі, з експортом і API.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="group relative overflow-hidden rounded-2xl border border-line bg-panel p-6 lg:col-span-2 lg:p-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Search className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-[22px]">Розумний пошук</h3>
                <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-muted">
                  Повнотекстовий пошук по назвах, замовниках, КПВ і ЄДРПОУ. Фільтри за
                  регіоном, статусом, сумою та методом закупівлі.
                </p>
                <Link
                  href="/tenders"
                  className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-bold text-accent"
                >
                  Відкрити пошук <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            <div className="mt-8 rounded-xl border border-line bg-bg-soft p-3">
              <div className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2">
                <Search className="h-4 w-4 text-accent" />
                <span className="text-[13px] text-ink-soft">медичне обладнання</span>
                <span className="ml-auto rounded bg-panel-3 px-2 py-0.5 text-[10px] text-muted">
                  {formatNumber(stats.tenders)} результатів
                </span>
              </div>
              <div className="mt-2 grid gap-1">
                {stats.recent.slice(0, 2).map((t) => (
                  <div key={t.id} className="flex items-center gap-2 rounded-lg px-3 py-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    <span className="truncate text-[12px] text-muted">{t.title}</span>
                    <span className="mono ml-auto shrink-0 text-[11px] text-ink-soft">
                      {formatMoney(t.amount, { compact: true })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-6 lg:p-8">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-iris-soft text-iris">
              <BarChart3 className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-[22px]">Аналітика</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
              Структура витрат, регіони, КПВ, топ-замовники та економія.
            </p>
            <div className="mt-6 flex h-24 items-end gap-1.5">
              {[38, 55, 32, 70, 48, 86, 62, 94, 58, 76].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-gradient-to-t from-iris/20 to-iris/70"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-6 lg:p-8">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-success-soft text-success">
              <Building2 className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-[22px]">Компанії</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
              Історія перемог, суми, КПВ і контрагенти — за ЄДРПОУ.
            </p>
            <div className="mt-6 space-y-2">
              {stats.topRegions.slice(0, 3).map((r) => (
                <div key={r.value} className="flex items-center gap-2">
                  <span className="w-24 truncate text-[11.5px] text-muted">{r.label}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-3">
                    <span
                      className="block h-full rounded-full bg-success/70"
                      style={{
                        width: `${Math.max(8, (r.amount / (stats.topRegions[0]?.amount || 1)) * 100)}%`,
                      }}
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-6 lg:p-8">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-warn-soft text-warn">
              <Bell className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-[22px]">Сповіщення</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
              Збережіть пошук — і отримуйте нові закупівлі за фільтрами.
            </p>
            <div className="mt-6 rounded-xl border border-line bg-bg-soft p-3 text-[11.5px]">
              <p className="font-semibold text-ink-soft">Медицина · Київ · до 5 млн ₴</p>
              <p className="mt-1 text-muted">3 нові закупівлі за останню годину</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-line bg-panel p-6 lg:p-8">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-panel-3 text-ink">
              <Code2 className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-[22px]">Clarity API</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
              REST-доступ до закупівель, компаній та аналітики. JSON, пагінація, ключі.
            </p>
            <pre className="mono mt-5 overflow-hidden rounded-lg border border-line bg-bg-soft p-3 text-[10.5px] leading-relaxed text-muted">
              <span className="text-accent">GET</span> /api/v1/tenders?cpv=45{"\n"}
              <span className="text-iris">Authorization</span>: Bearer •••
            </pre>
            <Link
              href="/api-docs"
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-accent"
            >
              Документація <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* VALUE */}
      <section className="container-x py-20">
        <div className="rounded-3xl border border-line bg-panel-2/60 p-6 md:p-10">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="eyebrow">Для кого</p>
              <h2 className="mt-3 text-[clamp(28px,3.5vw,40px)]">
                Одна платформа —
                <br />
                різні відповіді.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                Журналісти знаходять аномалії, постачальники — нові ринки, громади —
                контроль витрат. Безкоштовний демо-доступ на 24 години.
              </p>
              <Link href="/register" className="btn btn-primary mt-6">
                Спробувати безкоштовно
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { t: "Журналістам", d: "Факти, динаміка, перевірка зв'язків", icon: ShieldCheck },
                { t: "Бізнесу", d: "Ринок, конкуренти, ціни", icon: Zap },
                { t: "Громадам", d: "Куди йдуть кошти громади", icon: Building2 },
              ].map((c) => (
                <div key={c.t} className="rounded-xl border border-line bg-panel p-4">
                  <c.icon className="h-5 w-5 text-accent" />
                  <p className="mt-3 text-[14px] font-bold">{c.t}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="container-x pb-20">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Тарифи</p>
            <h2 className="mt-3 text-[clamp(26px,3.5vw,36px)]">Прозорі умови</h2>
          </div>
          <Link href="/pricing" className="text-[13px] font-bold text-accent">
            Порівняти тарифи →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { name: "Демо", price: "0 ₴", per: "24 години", note: "Усі функції, один користувач", cta: "Активувати", href: "/register" },
            { name: "Про", price: "4 500 ₴", per: "на місяць", note: "Повний доступ, експорт, API", cta: "Обрати", href: "/pricing", featured: true },
            { name: "Команда", price: "12 000 ₴", per: "на місяць", note: "5 користувачів, пріоритетна підтримка", cta: "Обрати", href: "/pricing" },
          ].map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-6 ${
                p.featured ? "border-accent/60 bg-panel glow-accent" : "border-line bg-panel"
              }`}
            >
              {p.featured && (
                <span className="absolute right-4 top-4 rounded-full bg-accent px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-accent-fg">
                  популярний
                </span>
              )}
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-2">
                {p.name}
              </p>
              <p className="mt-4 font-display text-[34px] font-semibold tracking-tight">{p.price}</p>
              <p className="text-[11.5px] text-muted">{p.per}</p>
              <p className="mt-4 border-t border-line pt-4 text-[12.5px] text-muted">{p.note}</p>
              <Link
                href={p.href}
                className={`mt-5 flex h-10 items-center justify-center rounded-full text-[13px] font-bold ${
                  p.featured
                    ? "bg-accent text-accent-fg"
                    : "border border-line-strong text-ink hover:bg-panel-2"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-x pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-accent px-6 py-14 text-accent-fg md:px-14">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[24px] border-accent-fg/10" />
          <div className="absolute -bottom-24 right-24 h-64 w-64 rounded-full border-[18px] border-accent-fg/10" />
          <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] opacity-60">
                Відкриті дані — відкриті рішення
              </p>
              <h2 className="mt-4 max-w-2xl text-[clamp(30px,4.4vw,52px)] leading-[1.02]">
                Подивіться, куди
                <br />
                йдуть гроші.
              </h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/tenders"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent-fg px-6 text-[14px] font-bold text-accent"
              >
                Почати пошук <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-12 items-center justify-center rounded-full border border-accent-fg/25 px-6 text-[14px] font-bold"
              >
                Тарифи
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-0 py-3 sm:block sm:px-4 sm:py-4">
      <dd
        className={`whitespace-nowrap font-display text-[19px] font-semibold tracking-tight sm:text-[16px] lg:text-[21px] ${
          accent ? "text-accent" : "text-ink"
        }`}
      >
        {value}
      </dd>
      <dt className="mt-1 text-[10.5px] uppercase tracking-[0.1em] text-muted-2">{label}</dt>
    </div>
  );
}
