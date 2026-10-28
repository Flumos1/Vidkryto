import { NextResponse } from "next/server";
import crypto from "node:crypto";
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
        `SELECT s.*, (SELECT COUNT(*) FROM notifications n WHERE n.search_id = s.id AND n.read = 0) AS unread
         FROM saved_searches s WHERE s.user_id = ? ORDER BY s.created_at DESC`,
      )
      .all(user.id);
    return NextResponse.json({ items: rows });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as { name?: string; params?: string };
    const name = (body.name || "Мій пошук").trim().slice(0, 80);
    const params = (body.params || "").slice(0, 600);
    const id = crypto.randomUUID();
    const db = getDb();
    db.prepare(
      "INSERT INTO saved_searches (id, user_id, name, params_json, created_at, last_checked) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(id, user.id, name, params, new Date().toISOString(), new Date().toISOString());
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("saved-search create failed", err);
    return NextResponse.json({ error: "Не вдалося зберегти пошук." }, { status: 500 });
  }
}
