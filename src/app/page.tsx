// src/app/page.tsx
// Root redirect: authenticated users go to /dashboard, others to /login
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function RootPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!session.user) redirect("/login");
  if ((session.user as { role?: string }).role === "DRIVER") redirect("/driver");
  redirect("/dashboard");
}
