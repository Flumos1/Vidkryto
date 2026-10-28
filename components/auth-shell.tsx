import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "./logo";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100dvh-72px)] lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-14 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-[400px]">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-muted hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> На головну
          </Link>
          <h1 className="mt-8 font-display text-[clamp(28px,3.4vw,38px)] tracking-[-0.04em]">
            {title}
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-accent p-12 text-accent-fg lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[28px] border-accent-fg/10" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full border-[36px] border-accent-fg/10" />
        <div className="relative">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] opacity-60">
            Vidkryto · доступ
          </span>
        </div>
        <div className="relative">
          <p className="max-w-md font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.04em]">
            Прозорість —
            <br />
            це не звіт.
            <br />
            Це інструмент.
          </p>
          <p className="mt-5 max-w-sm text-[13px] leading-relaxed opacity-70">
            Отримайте доступ до пошуку, аналітики та перевірки контрагентів за даними
            ProZorro. Демо на 24 години — без картки.
          </p>
        </div>
        <div className="relative grid grid-cols-3 gap-4 border-t border-accent-fg/15 pt-6">
          {[
            { v: "140+", l: "реєстрів" },
            { v: "6 тис.", l: "закупівель" },
            { v: "24 год", l: "демо" },
          ].map((s) => (
            <div key={s.l}>
              <p className="font-display text-[24px] font-semibold">{s.v}</p>
              <p className="mt-0.5 text-[10.5px] uppercase tracking-[0.12em] opacity-60">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AuthMobileLogo() {
  return (
    <div className="mb-8 lg:hidden">
      <Logo />
    </div>
  );
}
