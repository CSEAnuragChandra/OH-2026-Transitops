// src/app/(dashboard)/layout.tsx
// Authenticated app shell layout with sidebar
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import type { Role } from "@prisma/client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!session.user) redirect("/login");

  const role = (session.user as { role: Role }).role;
  if (role === "DRIVER") redirect("/driver");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        userName={session.user.name ?? "User"}
        userEmail={session.user.email ?? ""}
        userRole={role}
      />
      <main className="flex-1 overflow-y-auto p-6" style={{ background: "var(--bg)" }}>
        {children}
      </main>
    </div>
  );
}
