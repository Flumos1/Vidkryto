import Link from "next/link";
import { ArrowUpRight, Gavel, Info, MapPin, ShieldAlert } from "lucide-react";
import { demoAuctions } from "@/lib/auctions";
import { formatDateTime, formatMoney } from "@/lib/format";

export const metadata = {
  title: "Аукціони ProZorro.Продажі",
  description: "Каталог лотів: оренда, приватизація, транспорт, арештовані активи та земля.",
};

const STATUS: Record<string, { label: string; cls: string }> = {
  live: { label: "Триває", cls: "badge-complete" },
  soon: { label: "Незабаром", cls: "badge-active" },
  closed: { label: "Завершено", cls: "badge-neutral" },
};

const VISUALS = [
  "from-lime-200/20 to-emerald-500/10",
  "from-blue-300/20 to-indigo-500/10",
  "from-amber-200/20 to-orange-500/10",
  "from-violet-300/20 to-fuchsia-500/10",
];

export default function AuctionsPage() {
  return (
    <div className="container-x py-8 lg:py-10">
      <nav className="flex items-center gap-1.5 text-[11.5px] text-muted-2">
        <Link href="/" className="hover:text-ink">
          Головна
        </Link>
        <span>/</span>
        <span className="text-muted">Аукціони</span>
      </nav>

      <div className="mt-5 flex flex-col gap-5 border-b border-line pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-[clamp(30px,4vw,44px)] font-semibold tracking-[-0.04em]">
            Аукціони
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
            Оренда й продаж державного майна, арештовані активи, земля та спеціальні
            дозволи — в одному каталозі.
          </p>
        </div>
        <a
          href="https://prozorro.sale"
          target="_blank"
          rel="noreferrer noopener"
          className="btn btn-ghost btn-sm"
        >
          ProZorro.Продажі <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
        <p className="text-[11.5px] leading-relaxed text-muted">
          <span className="font-semibold text-ink">Демонстраційний каталог.</span> Публічний
          API ProZorro.Продажі потребує ключа майданчика. Додайте{" "}
          <code className="mono rounded bg-panel px-1 py-0.5 text-[10.5px] text-accent">
            PROZORRO_SALE_TOKEN
          </code>{" "}
          у змінні середовища — і модуль перемкнеться на живі дані. Показані лоти
          ілюструють інтерфейс.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {["Усі", "Оренда", "Приватизація", "Земля", "Транспорт", "Арештовані активи", "Дозволи"].map(
          (c, i) => (
            <span key={c} className="chip" data-active={i === 0}>
              {c}
            </span>
          ),
        )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {demoAuctions.map((lot, i) => {
          const status = STATUS[lot.status];
          return (
            <div
              key={lot.id}
              className="group overflow-hidden rounded-2xl border border-line bg-panel transition-colors hover:border-line-strong"
            >
              <div
                className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${VISUALS[i % VISUALS.length]}`}
              >
                <Gavel className="h-9 w-9 text-ink/40" />
                <span className={`badge ${status.cls} absolute left-3 top-3`}>{status.label}</span>
                <span className="absolute right-3 top-3 rounded bg-black/25 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-white/70">
                  демо
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-[10px] text-muted-2">
                  <span className="rounded bg-panel-3 px-1.5 py-0.5 font-semibold">{lot.category}</span>
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" /> {lot.region}
                  </span>
                </div>
                <h2 className="mt-2 line-clamp-2 text-[13.5px] font-semibold leading-snug text-ink-soft group-hover:text-accent">
                  {lot.title}
                </h2>
                <p className="mt-1 line-clamp-1 text-[10.5px] text-muted-2">{lot.organizer}</p>
                <div className="mt-3 flex items-end justify-between border-t border-line pt-3">
                  <div>
                    <p className="text-[9px] uppercase tracking-wide text-muted-2">стартова ціна</p>
                    <p className="mono text-[15px] font-semibold">{formatMoney(lot.startPrice, { compact: true })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-wide text-muted-2">дата</p>
                    <p className="text-[10.5px] text-muted">{formatDateTime(lot.date)}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 rounded-2xl border border-line bg-panel-2 p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="text-[13px] font-bold">Як підключити живі аукціони</p>
            <p className="mt-1 max-w-2xl text-[11.5px] leading-relaxed text-muted">
              Отримайте доступ майданчика на prozorro.sale, додайте токен у{" "}
              <code className="mono text-accent">.env.local</code> і перезапустіть сервер.
              Адаптер уже підтримує пагінацію, фільтри та мапінг статусів.
            </p>
          </div>
        </div>
        <a href="/api-docs" className="btn btn-primary btn-sm shrink-0">
          Документація API
        </a>
      </div>
    </div>
  );
}
