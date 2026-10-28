import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (name.length < 2) {
      return NextResponse.json({ error: "Вкажіть ім'я (мінімум 2 символи)." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Некоректна email-адреса." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Пароль має містити щонайменше 8 символів." }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return NextResponse.json({ error: "Користувач з таким email вже існує." }, { status: 409 });
    }

    const id = crypto.randomUUID();
    db.prepare(
      "INSERT INTO users (id, email, name, password_hash, created_at, plan) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(id, email, name, hashPassword(password), new Date().toISOString(), "demo");

    await setSessionCookie(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("register failed", err);
    return NextResponse.json(
      { error: "Не вдалося створити акаунт. Перевірте, чи база даних ініціалізована." },
      { status: 500 },
    );
  }
}
