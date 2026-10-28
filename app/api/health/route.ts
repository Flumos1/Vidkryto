import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSyncInfo } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const tenders = db.prepare("SELECT COUNT(*) AS n FROM tenders").get() as { n: number };
    const companies = db.prepare("SELECT COUNT(*) AS n FROM companies").get() as { n: number };
    const sanctions = db.prepare("SELECT COUNT(*) AS n FROM sanctions").get() as { n: number };
    const amku = db.prepare("SELECT COUNT(*) AS n FROM amku_violations").get() as { n: number };
    const sync = getSyncInfo();
    return NextResponse.json(
      {
        ok: true,
        tenders: tenders.n,
        companies: companies.n,
        sanctions: sanctions.n,
        amku_violations: amku.n,
        last_seed: sync.lastSeed,
        database: process.env.DB_FILE || "data/clarity.db",
        version: process.env.npm_package_version || "1.0.0",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "database unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
