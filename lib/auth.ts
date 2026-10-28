import { cookies } from "next/headers";
import crypto from "node:crypto";
import { getDb } from "./db";

const COOKIE = "vidkryto_session";
const SECRET = process.env.AUTH_SECRET || "vidkryto-local-dev-secret-change-me";
const MAX_AGE = 60 * 60 * 24 * 30;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  plan: string;
};

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function createToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + MAX_AGE * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (
    expected.length !== signature.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      uid: string;
      exp: number;
    };
    if (!data.uid || data.exp < Date.now()) return null;
    return data.uid;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const uid = readToken(store.get(COOKIE)?.value);
    if (!uid) return null;
    const row = getDb()
      .prepare("SELECT id, email, name, plan FROM users WHERE id = ?")
      .get(uid) as SessionUser | undefined;
    return row ?? null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, createToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
