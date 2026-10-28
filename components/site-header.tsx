import { getCurrentUser } from "@/lib/auth";
import { HeaderClient } from "./header-client";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return <HeaderClient user={user ? { name: user.name, email: user.email, plan: user.plan } : null} />;
}
