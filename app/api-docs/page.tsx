import Link from "next/link";
import { ArrowUpRight, KeyRound, Server, ShieldCheck, Terminal, Zap } from "lucide-react";
import { CopyButton } from "@/components/copy-button";

export const metadata = {
  title: "API",
  description: "REST API для закупівель, компаній та аналітики на базі відкритих даних ProZorro.",
};

const ENDPOINTS = [
  {
    id: "tenders",
    method: "GET",
    path: "/tenders",
    title: "Пошук закупівель",
    desc: "Пагінований список процедур із фільтрами за текстом, статусом, регіоном, КПВ, сумою та датою.",
    params: [
      ["q", "string", "Пошук за назвою, замовником, ЄДРПОУ або КПВ"],
      ["status", "enum", "active · complete · cancelled · unsuccessful"],
      ["region", "string", "Назва області без слова «область»"],
      ["cpv", "string", "Код або префікс КПВ, наприклад 45"],
      ["amountMin / amountMax", "number", "Очікувана вартість, ₴"],
      ["from / to", "date", "Дата створення, YYYY-MM-DD"],
      ["sort", "enum", "date_desc · date_asc · amount_desc · amount_asc · bids_desc"],
      ["page / perPage", "number", "Сторінка та розмір (макс. 100)"],
      ["facets", "0|1", "Додати агрегати для фільтрів"],
    ],
  },
  {
    id: "tender",
    method: "GET",
    path: "/tenders/{id}",
    title: "Картка закупівлі",
    desc: "Повні дані процедури: позиції, учасники, переможці, документи, скарги, договори.",
    params: [["id", "string", "Внутрішній id або UA-номер закупівлі"]],
  },
  {
    id: "companies",
    method: "GET",
    path: "/companies",
    title: "Реєстр компаній",
    desc: "Пошук замовників і постачальників за назвою або ЄДРПОУ з агрегованою статистикою.",
    params: [
      ["q", "string", "Назва або код ЄДРПОУ"],
      ["kind", "enum", "buyer · supplier · both"],
      ["sort", "enum", "tenders · amount · wins · name"],
      ["page / perPage", "number", "Пагінація"],
    ],
  },
  {
    id: "company",
    method: "GET",
    path: "/companies/{edrpou}",
    title: "Профіль компанії",
    desc: "Статистика участей, перемог, суми, структура КПВ, контрагенти та останні закупівлі.",
    params: [["edrpou", "string", "Код ЄДРПОУ (8–10 цифр)"]],
  },
  {
    id: "analytics",
    method: "GET",
    path: "/analytics",
    title: "Аналітика ринку",
    desc: "KPI, динаміка за днями, регіони, КПВ, статуси, топ-замовники та постачальники.",
    params: [],
  },
  {
    id: "export",
    method: "GET",
    path: "/export",
    title: "Експорт",
    desc: "Вивантаження результатів пошуку у CSV або XLSX. Ті самі фільтри, що й у /tenders.",
    params: [
      ["format", "enum", "csv · xlsx"],
      ["type=analytics", "string", "Експорт агрегатів замість списку"],
    ],
  },
];

export default function ApiDocsPage() {
  return (
    <div className="container-x py-8 lg:py-10">
      <nav className="flex items-center gap-1.5 text-[11.5px] text-muted-2">
        <Link href="/" className="hover:text-ink">
          Головна
        </Link>
        <span>/</span>
        <span className="text-muted">API</span>
      </nav>

      <div className="mt-5 grid gap-8 border-b border-line pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-[11px] font-semibold text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> v1 · stable
          </div>
          <h1 className="mt-4 font-display text-[clamp(30px,4.2vw,48px)] font-semibold tracking-[-0.045em]">
            API для відкритих даних
          </h1>
          <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-muted">
            REST-доступ до закупівель, компаній та аналітики. JSON, пагінація, CORS, ключі
            доступу й ліміти. Безкоштовно для демо-акаунтів.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard" className="btn btn-ghost btn-sm">
            <KeyRound className="h-3.5 w-3.5" /> Отримати ключ
          </Link>
          <a href="/api/v1/tenders?perPage=2" target="_blank" className="btn btn-primary btn-sm">
            Спробувати <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-[88px]">
            <p className="eyebrow mb-3">На цій сторінці</p>
            <ul className="space-y-2 text-[12.5px]">
              <li>
                <a href="#start" className="text-muted hover:text-ink">
                  Швидкий старт
                </a>
              </li>
              <li>
                <a href="#auth" className="text-muted hover:text-ink">
                  Авторизація
                </a>
              </li>
              {ENDPOINTS.map((e) => (
                <li key={e.id}>
                  <a href={`#${e.id}`} className="text-muted hover:text-ink">
                    {e.path}
                  </a>
                </li>
              ))}
              <li>
                <a href="#errors" className="text-muted hover:text-ink">
                  Помилки
                </a>
              </li>
            </ul>
          </div>
        </aside>

        <div className="min-w-0 space-y-10">
          <section id="start">
            <h2 className="text-[20px]">Швидкий старт</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Базовий URL:{" "}
              <code className="mono rounded bg-panel px-1.5 py-0.5 text-[12px] text-accent">
                http://localhost:3000/api/v1
              </code>
              . Авторизація не обов&apos;язкова для публічних запитів, але ключ знімає
              обмеження демо-ліміту.
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-line bg-[#0a0c0a]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
                <span className="mono text-[10.5px] text-white/40">curl</span>
                <CopyButton
                  value='curl "http://localhost:3000/api/v1/tenders?cpv=45&perPage=5"'
                  label="Копіювати"
                  className="text-white/40 hover:text-white"
                />
              </div>
              <pre className="mono overflow-x-auto p-4 text-[11.5px] leading-relaxed text-white/75">
{`curl "http://localhost:3000/api/v1/tenders?cpv=45&perPage=5" \\
  -H "Authorization: Bearer vk_..."`}
              </pre>
            </div>
          </section>

          <section id="auth">
            <h2 className="text-[20px]">Авторизація та ліміти</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                { icon: KeyRound, t: "Bearer-ключ", d: "Створіть ключ у кабінеті. Формат: vk_<64 hex>." },
                { icon: Zap, t: "120 запитів/хв", d: "На IP-адресу або ключ. Заголовок X-RateLimit-*.", },
                { icon: ShieldCheck, t: "CORS відкритий", d: "можна викликати з браузера та серверів." },
              ].map((c) => (
                <div key={c.t} className="rounded-xl border border-line bg-panel p-4">
                  <c.icon className="h-4 w-4 text-accent" />
                  <p className="mt-2 text-[12.5px] font-bold">{c.t}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">{c.d}</p>
                </div>
              ))}
            </div>
          </section>

          {ENDPOINTS.map((e) => (
            <section key={e.id} id={e.id} className="scroll-mt-24">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-success-soft px-2 py-0.5 text-[10px] font-extrabold text-success">
                  {e.method}
                </span>
                <code className="mono text-[13px] text-ink">{e.path}</code>
                <span className="text-[12px] text-muted">— {e.title}</span>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{e.desc}</p>

              {e.params.length > 0 && (
                <div className="mt-3 overflow-x-auto rounded-xl border border-line">
                  <table className="table min-w-[560px]">
                    <thead>
                      <tr>
                        <th>Параметр</th>
                        <th>Тип</th>
                        <th>Опис</th>
                      </tr>
                    </thead>
                    <tbody>
                      {e.params.map(([p, t, d]) => (
                        <tr key={p}>
                          <td className="mono text-[11.5px] text-accent">{p}</td>
                          <td className="text-[11px] text-muted">{t}</td>
                          <td className="text-[11.5px] text-muted">{d}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {e.id === "tenders" && (
                <div className="mt-3 overflow-hidden rounded-xl border border-line bg-[#0a0c0a]">
                  <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
                    <Terminal className="h-3.5 w-3.5 text-white/40" />
                    <span className="mono text-[10.5px] text-white/40">200 OK</span>
                  </div>
                  <pre className="mono overflow-x-auto p-4 text-[11px] leading-relaxed text-white/75">
{`{
  "data": [
    {
      "id": "f8a5287c27314e05b86c6a2f324ce9d2",
      "tender_id": "UA-2026-10-27-014956-a",
      "title": "Послуга з прибирання вулиць",
      "status": "active",
      "amount": 8405.37,
      "currency": "UAH",
      "buyer": { "name": "Новокальчевська сільрада", "edrpou": "40146330" },
      "cpv": "90610000-6",
      "url": "/tenders/f8a5287c27314e05b86c6a2f324ce9d2"
    }
  ],
  "meta": { "total": 5999, "page": 1, "pages": 300 }
}`}
                  </pre>
                </div>
              )}
            </section>
          ))}

          <section id="errors">
            <h2 className="text-[20px]">Помилки</h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-line">
              <table className="table">
                <thead>
                  <tr>
                    <th>Код</th>
                    <th>Значення</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["400", "Некоректні параметри запиту"],
                    ["401", "Невірний або відкликаний API-ключ"],
                    ["404", "Об'єкт не знайдено"],
                    ["429", "Перевищено ліміт запитів"],
                    ["502", "Джерело даних тимчасово недоступне"],
                  ].map(([c, d]) => (
                    <tr key={c}>
                      <td className="mono text-[12px] text-accent">{c}</td>
                      <td className="text-[12px] text-muted">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="rounded-2xl border border-line bg-panel-2 p-5">
            <div className="flex items-start gap-3">
              <Server className="mt-0.5 h-4 w-4 text-accent" />
              <p className="text-[11.5px] leading-relaxed text-muted">
                API побудований на локальному знімку відкритих даних ProZorro. Для
                продакшену рекомендується власний ETL-пайплайн та кешування. Дані надаються
                «як є», без гарантій повноти.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
