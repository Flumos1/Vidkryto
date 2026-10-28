import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createNotificationsForUser, ingestLatest } from "@/lib/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  return NextResponse.json({
    ok: true,
    hint: "POST /api/sync запускає оновлення даних з ProZorro.",
  });
}

export async function POST() {
  try {
    const result = await ingestLatest(40);
    const user = await getCurrentUser();
    const notified = user ? createNotificationsForUser(user.id) : 0;
    return NextResponse.json({ ok: true, ...result, notified });
  } catch (err) {
    console.error("sync failed", err);
    return NextResponse.json({ ok: false, error: "Не вдалося оновити дані." }, { status: 502 });
  }
}
