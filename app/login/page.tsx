import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthMobileLogo, AuthShell } from "@/components/auth-shell";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Вхід",
  description: "Увійдіть до аналітичної платформи Vidkryto.",
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <AuthShell
      title="З поверненням"
      subtitle="Увійдіть, щоб керувати підписками, збереженими пошуками та експортами."
    >
      <AuthMobileLogo />
      <Suspense fallback={<div className="h-72 rounded-xl bg-panel-2" />}>
        <AuthForm mode="login" />
      </Suspense>
    </AuthShell>
  );
}
