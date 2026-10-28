import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthMobileLogo, AuthShell } from "@/components/auth-shell";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Реєстрація",
  description: "Створіть акаунт Vidkryto та отримайте демо-доступ на 24 години.",
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <AuthShell
      title="Демо-доступ"
      subtitle="24 години повного доступу до пошуку, аналітики та API. Без платіжної картки."
    >
      <AuthMobileLogo />
      <Suspense fallback={<div className="h-80 rounded-xl bg-panel-2" />}>
        <AuthForm mode="register" />
      </Suspense>
    </AuthShell>
  );
}
