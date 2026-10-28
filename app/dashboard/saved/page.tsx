import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bell, Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatDateTime, timeAgo } from "@/lib/format";
import { SavedSearchList } from "@/components/dashboard/saved-list";
import { MarkReadButton } from "@/components/dashboard/mark-read";

export const dynamic = "force-dynamic";

export const metadata = { title: "Мої підписки" };

export default async function SavedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/saved");

  const db = getDb();
  const saved = (
    db
      .prepare(
        `SELECT s.*, (SELECT COUNT(*) FROM notifications n WHERE n.search_id = s.id AND n.read = 0) AS unread
         FROM saved_searches s WHERE s.user_id = ? ORDER BY s.created_at DESC`,
      )
      .all(user.id) as unknown as {
      id: string;
      name: string;
      params_json: string;
      created_at: string;
      last_checked: string | null;
      unread: number;
    }[]
  ).map((s) => ({ ...s }));

  const notifications = db
    .prepare(
      `SELECT id, tender_id, title, created_at, read FROM notifications
       WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`,
    )
    .all(user.id) as unknown as {
    id: string;
    tender_id: string;
    title: string;
    created_at: string;
    read: number;
  }[];

  return (
    <div className="container-x py-8 lg:py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> До кабінету
      </Link>

      <div className="mt-5 flex flex-col gap-3 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-[clamp(28px,3.6vw,40px)] tracking-[-0.04em]">
            Мої підписки
          </h1>
          <p className="mt-1.5 text-[13px] text-muted">
            Збережені фільтри та сповіщення про нові закупівлі.
          </p>
        </div>
        <Link href="/tenders" className="btn btn-primary btn-sm">
          <Search className="h-3.5 w-3.5" /> Новий пошук
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-[14px] font-bold">Збережені пошуки</h2>
            <span className="text-[11px] text-muted-2">{saved.length}</span>
          </div>
          <div className="p-3">
            <SavedSearchList items={saved} />
          </div>
          <p className="border-t border-line px-5 py-3 text-[10.5px] leading-relaxed text-muted-2">
            Щоб створити підписку, відкрийте пошук і натисніть «Зберегти». Сповіщення
            з&apos;являться після оновлення даних.
          </p>
        </section>

        <section className="rounded-2xl border border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="flex items-center gap-2 text-[14px] font-bold">
              <Bell className="h-4 w-4 text-accent" /> Стрічка сповіщень
            </h2>
            {notifications.some((n) => !n.read) && <MarkReadButton />}
          </div>
          <div className="divide-y divide-line">
            {notifications.length === 0 && (
              <div className="px-5 py-12 text-center">
                <Bell className="mx-auto h-6 w-6 text-muted-2" />
                <p className="mt-2 text-[12px] text-muted">Сповіщень поки немає.</p>
              </div>
            )}
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={`/tenders/${n.tender_id}`}
                className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-panel-2"
              >
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    n.read ? "bg-muted-2" : "bg-accent"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[12.5px] font-semibold text-ink-soft">{n.title}</p>
                  <p className="mt-0.5 text-[10.5px] text-muted-2" title={formatDateTime(n.created_at)}>
                    {timeAgo(n.created_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
