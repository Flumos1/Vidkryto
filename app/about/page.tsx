import Link from "next/link";
import { ArrowUpRight, Code2, Database, Eye, Layers, ShieldCheck, Sparkles } from "lucide-react";

export const metadata = {
  title: "Про проєкт",
  description: "Vidkryto — незалежна аналітика публічних закупівель на відкритих даних.",
};

export default function AboutPage() {
  return (
    <div className="container-x py-10 lg:py-14">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="eyebrow">Про проєкт</p>
          <h1 className="mt-3 font-display text-[clamp(34px,5vw,58px)] font-semibold leading-[1.02] tracking-[-0.05em]">
            Прозорість —
            <br />
            <span className="text-accent">як продукт.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-muted">
            Vidkryto — незалежна аналітична платформа, що робить публічні закупівлі
            зрозумілими. Ми збираємо відкриті дані, нормалізуємо їх і будуємо інструменти,
            якими користуються журналісти, бізнес і громади.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/tenders" className="btn btn-primary">
              Дослідити дані <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/sources" className="btn btn-ghost">
              Джерела даних
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { v: "6 000+", l: "процедур у вибірці" },
            { v: "₴14 млрд", l: "обіг у базі" },
            { v: "140+", l: "джерел даних" },
            { v: "100%", l: "відкриті дані" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-line bg-panel p-5">
              <p className="font-display text-[26px] font-semibold tracking-tight">{s.v}</p>
              <p className="mt-1 text-[10.5px] uppercase tracking-[0.1em] text-muted-2">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Eye,
            t: "Прозорість",
            d: "Кожна цифра має джерело й посилання на першоджерело. Ми не ховаємо методологію.",
          },
          {
            icon: ShieldCheck,
            t: "Незалежність",
            d: "Проєкт не пов'язаний з державними органами чи політичними структурами.",
          },
          {
            icon: Sparkles,
            t: "Корисність",
            d: "Дані мають сенс лише тоді, коли допомагають ухвалювати рішення.",
          },
        ].map((c) => (
          <div key={c.t} className="rounded-2xl border border-line bg-panel p-6">
            <c.icon className="h-5 w-5 text-accent" />
            <h2 className="mt-3 text-[17px]">{c.t}</h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{c.d}</p>
          </div>
        ))}
      </div>

      <section className="mt-16">
        <p className="eyebrow">Як це працює</p>
        <h2 className="mt-3 max-w-xl text-[clamp(26px,3.4vw,38px)]">
          Від сирих даних —
          <br /> до рішення за секунди.
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { n: "01", t: "Збір", d: "ProZorro API та відкриті реєстри, щохвилинна синхронізація." },
            { n: "02", t: "Нормалізація", d: "Єдина схема: компанії, КПВ, регіони, статуси." },
            { n: "03", t: "Зв'язування", d: "ЄДРПОУ пов'язує замовників, учасників і переможців." },
            { n: "04", t: "Інтерфейс", d: "Пошук, аналітика, профілі компаній, експорт та API." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-line bg-panel p-5">
              <p className="mono text-[11px] text-accent">{s.n}</p>
              <p className="mt-3 text-[15px] font-bold">{s.t}</p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-panel p-6">
          <Layers className="h-5 w-5 text-accent" />
          <h2 className="mt-3 text-[18px]">Технології</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Next.js 16", "React 19", "TypeScript", "Tailwind CSS 4", "SQLite", "ProZorro API", "REST"].map(
              (t) => (
                <span key={t} className="chip">
                  {t}
                </span>
              ),
            )}
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-muted">
            Застосунок працює на локальному знімку відкритих даних і не передає ваші запити
            третім сторонам.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-6">
          <Database className="h-5 w-5 text-accent" />
          <h2 className="mt-3 text-[18px]">Дані та межі</h2>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            Вибірка охоплює процедури ProZorro за останні місяці й не є повною історією
            ринку. Частина реєстрів підключається через відкриті файли, тому оновлення
            може відставати. Сервіс не є офіційним джерелом і не надає юридичних висновків.
          </p>
          <Link href="/sources" className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-accent">
            Перелік джерел <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section className="mt-16 overflow-hidden rounded-3xl border border-line bg-panel-2 p-8 md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow">Контакти</p>
            <h2 className="mt-3 text-[clamp(24px,3vw,32px)]">Є питання або ідея?</h2>
            <p className="mt-2 max-w-md text-[12.5px] leading-relaxed text-muted">
              Напишіть нам — відповідаємо протягом робочого дня. Для медіа готуємо
              коментарі та вивантаження даних.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a href="mailto:hello@vidkryto.ua" className="btn btn-primary">
              hello@vidkryto.ua
            </a>
            <Link href="/api-docs" className="btn btn-ghost">
              <Code2 className="h-4 w-4" /> API
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
