import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const keys = db
    .prepare("SELECT id, name, created_at, last_used, requests FROM api_keys WHERE user_id = ?")
    .all(user.id);
  return NextResponse.json({ keys });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const db = getDb();
    const id = crypto.randomUUID();
    const key = `vk_${crypto.randomBytes(24).toString("hex")}`;
    db.prepare(
      "INSERT INTO api_keys (id, user_id, name, key, created_at, requests) VALUES (?, ?, ?, ?, ?, 0)",
    ).run(id, user.id, "Особистий ключ", key, new Date().toISOString());
    return NextResponse.json({ id, key });
  } catch (err) {
    console.error("api-key create failed", err);
    return NextResponse.json({ error: "Не вдалося створити ключ." }, { status: 500 });
  }
}
