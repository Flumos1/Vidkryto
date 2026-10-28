import Link from "next/link";
import { ArrowUpRight, Database, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { getSanctionsStats } from "@/lib/queries";
import { formatDate, formatNumber } from "@/lib/format";

export const metadata = {
  title: "Джерела даних",
  description: "Каталог державних реєстрів та відкритих даних, на яких працює аналітика Vidkryto.",
};

type Source = { name: string; owner: string; status: "live" | "historic" };

const GROUPS: { title: string; icon: string; sources: Source[] }[] = [
  {
    title: "Закупівлі та продажі",
    icon: "◈",
    sources: [
      { name: "ProZorro · процедури закупівель", owner: "ProZorro", status: "live" },
      { name: "ProZorro · звіти про закупівлі", owner: "ProZorro", status: "live" },
      { name: "ProZorro.Продажі · аукціони", owner: "ProZorro.Продажі", status: "live" },
      { name: "Державні закупівлі: річні плани", owner: "Мінекономіки", status: "live" },
      { name: "База даних використання публічних коштів", owner: "Мінфін", status: "live" },
    ],
  },
  {
    title: "Компанії та ФОП",
    icon: "◇",
    sources: [
      { name: "ЄДР юридичних осіб та ФОП", owner: "Мін'юст", status: "live" },
      { name: "Оприлюднення відомостей з ЄДР", owner: "Мін'юст", status: "live" },
      { name: "Реєстр платників ПДВ", owner: "ДПС", status: "historic" },
      { name: "Реєстр платників єдиного податку", owner: "ДПС", status: "historic" },
      { name: "Фінансова звітність підприємств", owner: "ДПС", status: "historic" },
      { name: "Реєстр боржників", owner: "Мін'юст", status: "historic" },
      { name: "Реєстр банкрутств", owner: "Мін'юст", status: "live" },
      { name: "Реєстр отримувачів державної допомоги", owner: "АМКУ", status: "live" },
    ],
  },
  {
    title: "Судова та антимонопольна практика",
    icon: "◉",
    sources: [
      { name: "Єдиний реєстр судових рішень", owner: "ДСА України", status: "live" },
      { name: "Рішення АМКУ щодо порушень", owner: "АМКУ", status: "live" },
      { name: "Рішення про оскарження торгів", owner: "АМКУ", status: "live" },
      { name: "Дисциплінарна відповідальність суддів", owner: "ВРП", status: "historic" },
      { name: "Декларації родинних зв'язків суддів", owner: "ВККС", status: "live" },
    ],
  },
  {
    title: "Санкції та комплаєнс",
    icon: "◍",
    sources: [
      { name: "Санкційні списки РНБО", owner: "РНБО", status: "live" },
      { name: "Перелік осіб, пов'язаних з тероризмом", owner: "Держфінмоніторинг", status: "live" },
      { name: "Реєстр корупційних правопорушень", owner: "НАЗК", status: "live" },
      { name: "Реєстр осіб, до яких застосовано очищення влади", owner: "Мін'юст", status: "live" },
      { name: "Міжнародні санкційні переліки", owner: "ЄС / OFAC", status: "live" },
    ],
  },
  {
    title: "Ліцензії, дозволи, патенти",
    icon: "◎",
    sources: [
      { name: "Ліцензійний реєстр НКЦПФР", owner: "НКЦПФР", status: "historic" },
      { name: "Реєстр ліцензій НБУ", owner: "НБУ", status: "live" },
      { name: "Дозволи на будівництво (ЄДЕССБ)", owner: "Мінрозвитку", status: "live" },
      { name: "Державний реєстр патентів України", owner: "Мінекономіки", status: "live" },
      { name: "Реєстр торговельних марок", owner: "Мінекономіки", status: "live" },
      { name: "Спеціальні дозволи на користування надрами", owner: "Держгеонадра", status: "historic" },
    ],
  },
  {
    title: "Фінанси та банки",
    icon: "◌",
    sources: [
      { name: "Довідник банківських установ", owner: "НБУ", status: "live" },
      { name: "Реєстр небанківських фінустанов", owner: "НБУ", status: "live" },
      { name: "Реєстр колекторських компаній", owner: "НБУ", status: "live" },
      { name: "Учасники системи BankID", owner: "НБУ", status: "live" },
      { name: "Реєстр аудиторських фірм", owner: "НКФП", status: "historic" },
      { name: "Реєстр бюро кредитних історій", owner: "НКФП", status: "historic" },
    ],
  },
  {
    title: "Місцеве самоврядування",
    icon: "◐",
    sources: [
      { name: "Дані ОТГ та громад", owner: "Мінрозвитку", status: "live" },
      { name: "Єдиний реєстр об'єктів державної власності", owner: "ФДМУ", status: "historic" },
      { name: "Реєстр корпоративних прав держави", owner: "ФДМУ", status: "historic" },
      { name: "Плани комплексних перевірок", owner: "Держрегуляторна служба", status: "live" },
      { name: "Реєстр громадських об'єднань", owner: "Мін'юст", status: "live" },
    ],
  },
];

export default function SourcesPage() {
  const total = GROUPS.reduce((s, g) => s + g.sources.length, 0);
  const sanctions = getSanctionsStats();
  return (
    <div className="container-x py-10 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-2xl">
          <p className="eyebrow">Дані</p>
          <h1 className="mt-3 font-display text-[clamp(30px,4.2vw,46px)] font-semibold tracking-[-0.045em]">
            140+ джерел.
            <br />
            <span className="text-muted">Один робочий простір.</span>
          </h1>
          <p className="mt-4 text-[13.5px] leading-relaxed text-muted">
            Ми збираємо відкриті дані з державних реєстрів, нормалізуємо їх і пов&apos;язуємо
            між собою за ЄДРПОУ, КПВ та адресами. Нижче — ключові джерела платформи.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-line bg-panel px-4 py-3">
            <p className="mono text-[22px] font-semibold text-accent">{total}+</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-2">у каталозі</p>
          </div>
          <div className="rounded-xl border border-line bg-panel px-4 py-3">
            <p className="mono text-[22px] font-semibold">140+</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-2">всього джерел</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4 rounded-2xl border border-line bg-panel-2 px-5 py-4 text-[11.5px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> Оновлюється автоматично
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-warn" /> Історичні дані
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-accent" /> Лише відкриті джерела
        </span>
      </div>

      {sanctions.count > 0 && (
        <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-accent/30 bg-panel p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warn-soft text-warn">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[13px] font-bold">Санкційний перелік — уже в базі</p>
              <p className="mt-0.5 text-[11.5px] text-muted">
                {formatNumber(sanctions.count)} записів · {formatNumber(sanctions.organizations)}{" "}
                організацій · {formatNumber(sanctions.persons)} осіб
                {sanctions.updatedAt ? ` · оновлено ${formatDate(sanctions.updatedAt)}` : ""}
              </p>
            </div>
          </div>
          <Link href="/sanctions" className="btn btn-ghost btn-sm shrink-0">
            Відкрити реєстр <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <div className="mt-8 space-y-10">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-panel text-accent">
                {g.icon}
              </span>
              <h2 className="text-[19px]">{g.title}</h2>
              <span className="ml-auto text-[11px] text-muted-2">{g.sources.length} джерел</span>
            </div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {g.sources.map((s) => (
                <div
                  key={s.name}
                  className="group flex items-start gap-3 rounded-xl border border-line bg-panel p-3.5 transition-colors hover:border-line-strong"
                >
                  <Database className="mt-0.5 h-4 w-4 shrink-0 text-muted-2" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold leading-snug text-ink-soft">{s.name}</p>
                    <p className="mt-0.5 text-[10.5px] text-muted-2">{s.owner}</p>
                  </div>
                  <span
                    className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                      s.status === "live" ? "bg-success" : "bg-warn"
                    }`}
                    title={s.status === "live" ? "Оновлюється" : "Історичні дані"}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-panel p-6">
          <RefreshCw className="h-5 w-5 text-accent" />
          <h2 className="mt-3 text-[17px]">Як оновлюються дані</h2>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
            Синхронізація з ProZorro виконується за запитом або за розкладом. Кожна
            процедура отримує унікальний ідентифікатор, а зміни зберігаються в історії.
            Реєстри, що не мають API, підключаються через відкриті файли.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-6">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <h2 className="mt-3 text-[17px]">Межі відповідальності</h2>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
            Дані можуть бути неповними або застарілими. Ми не є офіційним джерелом і не
            гарантуємо юридичну точність. Для офіційних довідок використовуйте першоджерела.
          </p>
          <Link href="/about" className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-semibold text-accent">
            Про методологію <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
