import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { siteUrl } from "@/lib/site";
import { getDataFreshness } from "@/lib/queries";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Vidkryto — аналітика публічних закупівель України",
    template: "%s · Vidkryto",
  },
  description:
    "Пошук закупівель ProZorro, аналітика цін, перевірка компаній та API на відкритих даних. Кожна гривня під наглядом.",
  keywords: [
    "ProZorro",
    "публічні закупівлі",
    "аналітика закупівель",
    "перевірка контрагентів",
    "тендери Україна",
  ],
  openGraph: {
    title: "Vidkryto — аналітика публічних закупівель",
    description:
      "Пошук, аналітика та перевірка контрагентів за даними ProZorro. Відкриті дані — відкриті рішення.",
    type: "website",
    locale: "uk_UA",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08090b" },
    { media: "(prefers-color-scheme: light)", color: "#f3f2ec" },
  ],
  width: "device-width",
  initialScale: 1,
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme')||'dark';document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const freshness = getDataFreshness();
  const freshnessColor =
    freshness.status === "fresh"
      ? "bg-success"
      : freshness.status === "stale"
        ? "bg-warn"
        : freshness.status === "old"
          ? "bg-danger"
          : "bg-muted-2";

  return (
    <html lang="uk" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Unbounded:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-fg"
        >
          Перейти до вмісту
        </a>
        <div className="border-b border-line bg-panel-2">
          <div className="container-x flex h-8 items-center justify-between gap-3 text-[10.5px] text-muted">
            <div className="flex min-w-0 items-center gap-2">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${freshnessColor}`} />
              <span className="truncate">Дані: ProZorro · АМКУ · Санкції</span>
            </div>
            <Link
              href="/sources"
              title={freshness.title}
              className="shrink-0 transition-colors hover:text-ink"
            >
              Оновлено {freshness.label} · джерела
            </Link>
          </div>
        </div>
        <SiteHeader />
        <main id="content" className="flex-1">
          {children}
        </main>
        <SiteFooter freshness={freshness} />
      </body>
    </html>
  );
}
