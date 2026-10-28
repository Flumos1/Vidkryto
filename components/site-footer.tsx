import Link from "next/link";
import { Logo } from "./logo";

const columns: {
  title: string;
  links: { href: string; label: string; external?: boolean }[];
}[] = [
  {
    title: "Продукт",
    links: [
      { href: "/tenders", label: "Закупівлі" },
      { href: "/analytics", label: "Аналітика" },
      { href: "/companies", label: "Компанії" },
      { href: "/sanctions", label: "Санкції" },
      { href: "/prices", label: "Ціни" },
      { href: "/auctions", label: "Аукціони" },
    ],
  },
  {
    title: "Ресурси",
    links: [
      { href: "/api-docs", label: "Clarity API" },
      { href: "/sources", label: "Джерела даних" },
      { href: "/pricing", label: "Тарифи" },
      { href: "/about", label: "Про проєкт" },
      { href: "/dashboard", label: "Кабінет" },
    ],
  },
  {
    title: "Дані",
    links: [
      { href: "https://public-api.prozorro.gov.ua/api/2.5/tenders", label: "ProZorro API", external: true },
      { href: "https://prozorro.sale", label: "ProZorro.Продажі", external: true },
      { href: "https://data.gov.ua", label: "data.gov.ua", external: true },
      { href: "https://edr.minjust.gov.ua", label: "ЄДР", external: true },
    ],
  },
];

export function SiteFooter({
  freshness,
}: {
  freshness?: { label: string; status: string; title: string };
}) {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-line bg-bg-soft">
      <div className="container-x relative z-10 py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">
              Аналітична платформа публічних закупівель. Пошук, ціни, контрагенти та API на
              основі відкритих даних.
            </p>
            <div
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-[11px] text-muted"
              title={freshness?.title}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="pulse-dot absolute inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              Оновлено {freshness?.label ?? "—"}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <p className="eyebrow mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-[13.5px] text-muted transition-colors hover:text-ink"
                      >
                        {link.label} ↗
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-[13.5px] text-muted transition-colors hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-2">
            <p className="eyebrow mb-4">Контакти</p>
            <a
              href="mailto:hello@vidkryto.ua"
              className="text-[13.5px] text-muted transition-colors hover:text-ink"
            >
              hello@vidkryto.ua
            </a>
            <p className="mt-3 text-[12px] leading-relaxed text-muted-2">
              Київ, Україна
              <br />
              Пн–Пт, 9:00–18:00
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-6 text-[11.5px] text-muted-2 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Vidkryto. Відкриті дані — відкриті рішення.</p>
          <p className="max-w-xl md:text-right">
            Сервіс є незалежним проєктом і не пов&apos;язаний з ProZorro, Clarity Project чи
            державними органами. Дані надаються «як є».
          </p>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none select-none px-6 pb-2 text-center font-display text-[18vw] font-bold leading-[0.8] tracking-[-0.06em] text-ink/[0.035]"
      >
        vidkryto
      </div>
    </footer>
  );
}
