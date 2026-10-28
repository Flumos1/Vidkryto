import { NextResponse } from "next/server";
import { getDb } from "./db";

const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(ip: string, limit = 120): { ok: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || bucket.reset < now) {
    buckets.set(ip, { count: 1, reset: now + 60_000 });
    return { ok: true, remaining: limit - 1 };
  }
  bucket.count += 1;
  return { ok: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count) };
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

export function checkApiKey(request: Request): { valid: boolean; key: string | null } {
  const header = request.headers.get("authorization") || "";
  const key = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!key) return { valid: true, key: null };
  if (!key.startsWith("vk_")) return { valid: false, key };
  try {
    const db = getDb();
    const row = db.prepare("SELECT id FROM api_keys WHERE key = ?").get(key);
    if (!row) return { valid: false, key };
    db.prepare("UPDATE api_keys SET requests = requests + 1, last_used = ? WHERE key = ?").run(
      new Date().toISOString(),
      key,
    );
    return { valid: true, key };
  } catch {
    return { valid: false, key };
  }
}

export function apiResponse(
  data: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
) {
  return NextResponse.json(data, {
    status: init.status || 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
      ...init.headers,
    },
  });
}

export function apiError(message: string, status = 400) {
  return apiResponse({ error: { message, status } }, { status, headers: { "Cache-Control": "no-store" } });
}

export function preflight() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
