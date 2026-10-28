import { NextResponse } from "next/server";
import { quickSearch } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().slice(0, 80);
  if (q.length < 2) {
    return NextResponse.json({ tenders: [], companies: [] });
  }
  const data = quickSearch(q);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, max-age=15" },
  });
}
