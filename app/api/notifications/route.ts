import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT id, search_id, tender_id, title, created_at, read FROM notifications
         WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      )
      .all(user.id);
    return NextResponse.json({ items: rows });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const db = getDb();
    db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
