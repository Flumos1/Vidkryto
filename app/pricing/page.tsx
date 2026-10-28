import Link from "next/link";
import { ArrowUpRight, Check, Minus } from "lucide-react";

export const metadata = {
  title: "Тарифи",
  description: "Демо-доступ безкоштовно, місячні та річні тарифи для аналітики закупівель.",
};

const PLANS = [
  {
    name: "Демо",
    price: "0 ₴",
    period: "24 години",
    note: "Для знайомства з платформою",
    cta: "Активувати",
    href: "/register",
    features: ["Пошук і фільтри", "Аналітика ринку", "5 експортів", "1 користувач", "API: 60 запитів/хв"],
  },
  {
    name: "Про",
    price: "4 500 ₴",
    period: "на місяць",
    note: "Для аналітиків і журналістів",
    cta: "Оформити",
    href: "/register?plan=pro",
    features: [
      "Необмежений пошук",
      "Повна аналітика та ціни",
      "Необмежені експорти CSV/XLSX",
      "Збережені пошуки та сповіщення",
      "API: 120 запитів/хв",
      "1 користувач",
    ],
    featured: true,
  },
  {
    name: "Команда",
    price: "12 000 ₴",
    period: "на місяць",
    note: "Для відділів і редакцій",
    cta: "Оформити",
    href: "/register?plan=team",
    features: [
      "Все з тарифу «Про»",
      "5 користувачів",
      "Пріоритетна підтримка",
      "Вивантаження в BI",
      "API: 300 запитів/хв",
      "Рахунок для юрособи",
    ],
  },
];

const COMPARISON: [string, boolean | string, boolean | string, boolean | string][] = [
  ["Пошук закупівель", true, true, true],
  ["Фільтри та сортування", true, true, true],
  ["Аналітика ринку", true, true, true],
  ["Цінові бенчмарки", "частково", true, true],
  ["Профілі компаній", true, true, true],
  ["Експорт CSV", "5/добу", "безліміт", "безліміт"],
  ["Експорт XLSX", "5/добу", "безліміт", "безліміт"],
  ["Збережені пошуки", "1", "20", "100"],
  ["Сповіщення", false, true, true],
  ["API-ключі", "1", "3", "10"],
  ["Користувачів", "1", "1", "5"],
  ["Підтримка", "email", "email", "пріоритетна"],
];

const FAQ = [
  {
    q: "Звідки дані?",
    a: "З відкритого API ProZorro та державних реєстрів. Ми не використовуємо закриті джерела і не продаємо персональні дані.",
  },
  {
    q: "Чи можна скасувати підписку?",
    a: "Так, у будь-який момент у кабінеті. Доступ зберігається до кінця оплаченого періоду.",
  },
  {
    q: "Чи є API для інтеграції?",
    a: "Так, REST API з JSON, пагінацією та ключами. Документація доступна на сторінці API.",
  },
  {
    q: "Чи є знижка на річний доступ?",
    a: "Так, при оплаті за рік діє знижка 20%. Для юридичних осіб виставляємо рахунок.",
  },
  {
    q: "Це офіційний сервіс ProZorro?",
    a: "Ні. Це незалежний аналітичний продукт на відкритих даних. Офіційні дані — на prozorro.gov.ua.",
  },
];

export default function PricingPage() {
  return (
    <div className="container-x py-10 lg:py-14">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow justify-center">Тарифи</p>
        <h1 className="mt-3 font-display text-[clamp(32px,4.6vw,52px)] font-semibold tracking-[-0.045em]">
          Прозорі умови.
          <br />
          <span className="text-muted">Без прихованих платежів.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[13.5px] leading-relaxed text-muted">
          Почніть з безкоштовного демо на 24 години. Далі — фіксована ціна за місяць або
          рік, без обмежень на кількість переглядів.
        </p>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`relative flex flex-col rounded-2xl border p-6 ${
              p.featured ? "border-accent/60 bg-panel glow-accent" : "border-line bg-panel"
            }`}
          >
            {p.featured && (
              <span className="absolute right-5 top-5 rounded-full bg-accent px-2.5 py-1 text-[9.5px] font-extrabold uppercase tracking-wider text-accent-fg">
                популярний
              </span>
            )}
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-2">{p.name}</p>
            <p className="mt-4 font-display text-[40px] font-semibold tracking-tight">{p.price}</p>
            <p className="text-[11.5px] text-muted">{p.period}</p>
            <p className="mt-2 text-[12px] text-muted-2">{p.note}</p>

            <ul className="mt-5 flex-1 space-y-2.5 border-t border-line pt-5">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[12.5px] text-ink-soft">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={p.href}
              className={`mt-6 flex h-11 items-center justify-center rounded-full text-[13px] font-bold ${
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

      <p className="mt-4 text-center text-[11px] text-muted-2">
        Ціни вказані з ПДВ. Демо-доступ активується після реєстрації. Оплата — після
        підтвердження менеджером.
      </p>

      <div className="mt-14 overflow-x-auto rounded-2xl border border-line bg-panel">
        <table className="table min-w-[640px]">
          <thead>
            <tr>
              <th>Можливість</th>
              <th className="text-center">Демо</th>
              <th className="text-center">Про</th>
              <th className="text-center">Команда</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map(([label, demo, pro, team]) => (
              <tr key={label}>
                <td className="text-[12.5px] text-ink-soft">{label}</td>
                {[demo, pro, team].map((v, i) => (
                  <td key={i} className="text-center">
                    {v === true ? (
                      <Check className="mx-auto h-4 w-4 text-accent" />
                    ) : v === false ? (
                      <Minus className="mx-auto h-4 w-4 text-muted-2" />
                    ) : (
                      <span className="text-[11px] text-muted">{v}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow">Питання</p>
          <h2 className="mt-3 text-[clamp(24px,3vw,34px)]">Коротко про головне</h2>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            Не знайшли відповідь? Напишіть на{" "}
            <a href="mailto:hello@vidkryto.ua" className="font-semibold text-accent">
              hello@vidkryto.ua
            </a>
          </p>
        </div>
        <div className="divide-y divide-line border-y border-line">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[13.5px] font-semibold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="text-muted-2 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="mt-16 flex flex-col items-center gap-4 rounded-3xl border border-line bg-panel-2 px-6 py-10 text-center">
        <h2 className="max-w-xl text-[clamp(24px,3vw,32px)]">Готові подивитися на дані?</h2>
        <p className="max-w-md text-[12.5px] text-muted">
          Демо на 24 години відкриває пошук, аналітику та API. Картка не потрібна.
        </p>
        <Link href="/register" className="btn btn-primary">
          Створити демо-акаунт <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
