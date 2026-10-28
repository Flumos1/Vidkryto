import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { filtersToQuery } from "@/lib/params";
import type { TenderFilters } from "@/lib/queries";

function pageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

export function Pagination({
  filters,
  page,
  pages,
  extra = {},
}: {
  filters: TenderFilters;
  page: number;
  pages: number;
  extra?: Record<string, string>;
}) {
  if (pages <= 1) return null;
  const build = (p: number) => {
    const q = filtersToQuery({ ...filters, page: p }, extra);
    return `/tenders${q}`;
  };

  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Пагінація">
      <Link
        href={build(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={`grid h-9 w-9 place-items-center rounded-full border border-line ${
          page === 1 ? "pointer-events-none opacity-40" : "hover:bg-panel-2"
        }`}
        aria-label="Назад"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      {pageRange(page, pages).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-muted-2">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={build(p)}
            className={`mono grid h-9 min-w-9 place-items-center rounded-full border px-2 text-[12.5px] font-semibold ${
              p === page
                ? "border-accent bg-accent text-accent-fg"
                : "border-line text-muted hover:bg-panel-2 hover:text-ink"
            }`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </Link>
        ),
      )}
      <Link
        href={build(Math.min(pages, page + 1))}
        aria-disabled={page === pages}
        className={`grid h-9 w-9 place-items-center rounded-full border border-line ${
          page === pages ? "pointer-events-none opacity-40" : "hover:bg-panel-2"
        }`}
        aria-label="Далі"
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
