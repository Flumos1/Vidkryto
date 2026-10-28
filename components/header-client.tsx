"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { CommandPalette } from "./command-palette";
import { nav } from "@/lib/site";

type User = { name: string; email: string; plan: string } | null;

export function HeaderClient({ user }: { user: User }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-[60] border-b border-line bg-[color-mix(in_srgb,var(--bg)_78%,transparent)] backdrop-blur-xl">
        <div className="container-x flex h-[72px] items-center gap-3">
          <Logo />

          <nav className="ml-6 hidden items-center gap-0.5 lg:flex" aria-label="Головна навігація">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition-colors ${
                  isActive(item.href)
                    ? "text-ink"
                    : "text-muted hover:bg-panel-2 hover:text-ink"
                }`}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute -bottom-[1px] left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-accent" />
                )}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("open-command"))}
              className="hidden h-10 items-center gap-2 rounded-full border border-line bg-panel-2 px-3 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-ink sm:flex"
              aria-label="Відкрити пошук"
            >
              <Search className="h-4 w-4" />
              <span className="hidden md:inline">Пошук</span>
              <kbd className="ml-1 hidden rounded border border-line bg-panel px-1.5 py-0.5 text-[10px] text-muted-2 md:inline">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("open-command"))}
              className="grid h-10 w-10 place-items-center rounded-full border border-line bg-panel-2 text-muted sm:hidden"
              aria-label="Пошук"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>

            <ThemeToggle />

            {user ? (
              <details className="group relative hidden sm:block">
                <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-line bg-panel-2 pl-1.5 pr-2.5 transition-colors hover:border-line-strong [&::-webkit-details-marker]:hidden">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-[11px] font-extrabold text-accent-fg">
                    {user.name.substring(0, 1).toUpperCase()}
                  </span>
                  <span className="max-w-[110px] truncate text-[13px] font-semibold">
                    {user.name.split(" ")[0]}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <div className="absolute right-0 top-[calc(100%+10px)] w-60 overflow-hidden rounded-xl border border-line bg-panel p-1.5 shadow-2xl">
                  <div className="px-3 py-2.5">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-[11px] text-muted">{user.email}</p>
                  </div>
                  <div className="my-1 h-px bg-line" />
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-panel-2"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Кабінет
                  </Link>
                  <Link
                    href="/dashboard/saved"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-panel-2"
                  >
                    <Sparkles className="h-4 w-4" /> Мої підписки
                  </Link>
                  <form action="/api/auth/logout" method="post">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-panel-2 hover:text-danger"
                    >
                      <LogOut className="h-4 w-4" /> Вийти
                    </button>
                  </form>
                </div>
              </details>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden h-10 items-center rounded-full px-3 text-[13.5px] font-semibold text-muted transition-colors hover:text-ink sm:flex"
                >
                  Увійти
                </Link>
                <Link href="/register" className="btn btn-primary btn-sm hidden md:inline-flex">
                  Демо-доступ
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full border border-line bg-panel-2 text-ink lg:hidden"
              aria-label={mobileOpen ? "Закрити меню" : "Відкрити меню"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-x-0 top-[72px] bottom-0 z-50 overflow-y-auto bg-bg lg:hidden">
          <div className="container-x py-6">
            <nav className="grid gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-lg font-semibold ${
                    isActive(item.href) ? "bg-panel-2 text-ink" : "text-muted"
                  }`}
                >
                  {item.label}
                  <span className="text-muted-2">→</span>
                </Link>
              ))}
            </nav>
            <div className="mt-6 grid gap-2 border-t border-line pt-6">
              {user ? (
                <Link href="/dashboard" className="btn btn-primary w-full">
                  Кабінет
                </Link>
              ) : (
                <>
                  <Link href="/login" className="btn btn-ghost w-full">
                    Увійти
                  </Link>
                  <Link href="/register" className="btn btn-primary w-full">
                    Демо-доступ
                  </Link>
                </>
              )}
            </div>
            <p className="mt-6 text-[11px] text-muted-2">
              Дані надаються ProZorro та партнерськими реєстрами. Сервіс не є офіційним.
            </p>
          </div>
        </div>
      )}

      <CommandPalette />
    </>
  );
}
