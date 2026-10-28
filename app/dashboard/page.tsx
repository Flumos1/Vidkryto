import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  Bookmark,
  CalendarClock,
  KeyRound,
  Search,
  Sparkles,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getSyncInfo, searchTenders } from "@/lib/queries";
import { formatDate, formatDateTime, formatNumber, timeAgo } from "@/lib/format";
import { SavedSearchList } from "@/components/dashboard/saved-list";
import { ApiKeyPanel } from "@/components/dashboard/api-key";
import { MarkReadButton } from "@/components/dashboard/mark-read";

export const dynamic = "force-dynamic";

export const metadata = { title: "Кабінет" };

type Saved = {
  id: string;
  name: string;
  params_json: string;
  created_at: string;
  last_checked: string | null;
  unread: number;
};

type Notification = {
  id: string;
  tender_id: string;
  title: string;
  created_at: string;
  read: number;
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const db = getDb();
  const createdAt = (
    db.prepare("SELECT created_at FROM users WHERE id = ?").get(user.id) as
      | { created_at: string }
      | undefined
  )?.created_at;

  const saved = (
    db
      .prepare(
        `SELECT s.*, (SELECT COUNT(*) FROM notifications n WHERE n.search_id = s.id AND n.read = 0) AS unread
         FROM saved_searches s WHERE s.user_id = ? ORDER BY s.created_at DESC`,
      )
      .all(user.id) as unknown as Saved[]
  ).map((s) => ({ ...s }));

  const notifications = db
    .prepare(
      `SELECT id, tender_id, title, created_at, read FROM notifications
       WHERE user_id = ? ORDER BY created_at DESC LIMIT 8`,
    )
    .all(user.id) as unknown as Notification[];

  const unread = notifications.filter((n) => !n.read).length;
  const keys = db
    .prepare("SELECT id, name, created_at, requests FROM api_keys WHERE user_id = ?")
    .all(user.id) as unknown as { id: string; name: string; created_at: string; requests: number }[];

  const sync = getSyncInfo();
  const latest = searchTenders({ perPage: 5, page: 1 });
  const expiry = createdAt ? new Date(new Date(createdAt).getTime() + 24 * 3600 * 1000) : null;
  const hoursLeft = expiry ? Math.max(0, Math.round((expiry.getTime() - Date.now()) / 3600000)) : 0;
  const progress = Math.min(100, Math.max(0, (hoursLeft / 24) * 100));

  return (
    <div className="container-x py-8 lg:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Кабінет</p>
          <h1 className="mt-2 font-display text-[clamp(28px,3.6vw,40px)] tracking-[-0.04em]">
            Вітаємо, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1.5 text-[13px] text-muted">{user.email}</p>
        </div>
        <Link href="/tenders" className="btn btn-primary btn-sm">
          <Search className="h-3.5 w-3.5" /> До пошуку
        </Link>
      </div>

      {user.plan === "demo" && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-accent/30 bg-panel">
          <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[13.5px] font-bold">Демо-доступ активний</p>
                <p className="mt-0.5 text-[12px] text-muted">
                  Залишилось ~{hoursLeft} год. Після завершення доступ до експорту та API
                  обмежується.
                </p>
              </div>
            </div>
            <Link href="/pricing" className="btn btn-ghost btn-sm shrink-0">
              Повний доступ <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="h-1 bg-panel-3">
            <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Bookmark} label="Збережених пошуків" value={formatNumber(saved.length)} />
        <Stat icon={Bell} label="Нових сповіщень" value={formatNumber(unread)} accent={unread > 0} />
        <Stat icon={KeyRound} label="API-ключів" value={formatNumber(keys.length)} />
        <Stat icon={CalendarClock} label="Закупівель у базі" value={formatNumber(sync.count)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-line bg-panel">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-[14px] font-bold">Мої підписки</h2>
              <Link href="/dashboard/saved" className="text-[11px] font-semibold text-accent">
                Усі →
              </Link>
            </div>
            <div className="p-3">
              <SavedSearchList items={saved.slice(0, 4)} />
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-panel">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-[14px] font-bold">Останні сповіщення</h2>
              {unread > 0 && <MarkReadButton />}
            </div>
            <div className="divide-y divide-line">
              {notifications.length === 0 && (
                <p className="px-5 py-10 text-center text-[12px] text-muted">
                  Сповіщень поки немає. Збережіть пошук і натисніть «Оновити дані».
                </p>
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
                    <p className="line-clamp-2 text-[12.5px] font-semibold text-ink-soft">
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-muted-2">{timeAgo(n.created_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <ApiKeyPanel keys={keys} />

          <div className="rounded-2xl border border-line bg-panel p-5">
            <h2 className="text-[14px] font-bold">Свіжі закупівлі</h2>
            <div className="mt-3 space-y-2">
              {latest.rows.map((t) => (
                <Link
                  key={t.id}
                  href={`/tenders/${t.id}`}
                  className="block rounded-lg border border-line bg-panel-2 p-2.5 hover:border-line-strong"
                >
                  <p className="line-clamp-1 text-[11.5px] font-semibold">{t.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted-2">{formatDate(t.date_created)}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-panel-2 p-5 text-[11.5px] leading-relaxed text-muted">
            <p className="font-semibold text-ink">Оновлення даних</p>
            <p className="mt-1">
              Остання синхронізація: {sync.lastSeed ? formatDateTime(sync.lastSeed) : "—"}
            </p>
            <Link href="/api/sync" className="mt-3 inline-block text-[11px] font-semibold text-accent">
              Перевірити нові закупівлі →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-accent/40" : "border-line"} bg-panel`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-2">{label}</p>
        <Icon className={`h-4 w-4 ${accent ? "text-accent" : "text-muted-2"}`} />
      </div>
      <p className="mono mt-2 text-[22px] font-semibold">{value}</p>
    </div>
  );
}
