import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import { hashPassword, setSessionCookie, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

const DEMO_EMAIL = "demo@vidkryto.ua";
const DEMO_PASSWORD = "demo1234";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    const db = getDb();
    let user = db
      .prepare("SELECT id, password_hash FROM users WHERE email = ?")
      .get(email) as { id: string; password_hash: string } | undefined;

    // Demo access is provisioned on first use.
    if (!user && email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      const id = crypto.randomUUID();
      const hash = hashPassword(DEMO_PASSWORD);
      db.prepare(
        "INSERT INTO users (id, email, name, password_hash, created_at, plan) VALUES (?, ?, ?, ?, ?, ?)",
      ).run(id, DEMO_EMAIL, "Демо-користувач", hash, new Date().toISOString(), "demo");
      user = { id, password_hash: hash };
    }

    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "Невірний email або пароль." }, { status: 401 });
    }

    await setSessionCookie(user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("login failed", err);
    return NextResponse.json({ error: "Помилка входу. Спробуйте пізніше." }, { status: 500 });
  }
}
