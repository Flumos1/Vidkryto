"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Щось пішло не так.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Мережева помилка. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail("demo@vidkryto.ua");
    setPassword("demo1234");
    setError(null);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "register" && (
        <div>
          <label className="label" htmlFor="name">
            Ім&apos;я
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field"
            placeholder="Олена Коваль"
            autoComplete="name"
            required
          />
        </div>
      )}

      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
          placeholder="you@company.ua"
          autoComplete="email"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          Пароль
        </label>
        <div className="relative">
          <input
            id="password"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field pr-11"
            placeholder="Мінімум 8 символів"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            aria-label={show ? "Приховати пароль" : "Показати пароль"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-[12px] text-danger">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-70">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {mode === "login" ? "Увійти" : "Створити акаунт"}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </button>

      {mode === "login" && (
        <button
          type="button"
          onClick={fillDemo}
          className="w-full rounded-lg border border-dashed border-line-strong px-3 py-2.5 text-[11.5px] text-muted transition-colors hover:border-accent hover:text-ink"
        >
          Демо-доступ: demo@vidkryto.ua / demo1234 — натисніть, щоб заповнити
        </button>
      )}

      <p className="text-center text-[12px] text-muted">
        {mode === "login" ? (
          <>
            Немає акаунта?{" "}
            <Link href="/register" className="font-semibold text-accent">
              Зареєструватися
            </Link>
          </>
        ) : (
          <>
            Вже маєте акаунт?{" "}
            <Link href="/login" className="font-semibold text-accent">
              Увійти
            </Link>
          </>
        )}
      </p>

      <p className="flex items-center justify-center gap-1.5 text-[10.5px] text-muted-2">
        <ShieldCheck className="h-3 w-3" /> Пароль зберігається у вигляді scrypt-хешу
      </p>
    </form>
  );
}
