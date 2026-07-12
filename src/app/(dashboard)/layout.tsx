// src/app/(dashboard)/layout.tsx
// Authenticated app shell layout with sidebar
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { STAFF_ROLES } from "@/lib/rbac";
import type { Role } from "@prisma/client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as { role: Role }).role;
  // Extra safety: if somehow a DRIVER reaches this layout, block them
  if (!STAFF_ROLES.includes(role)) redirect("/unauthorized");

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
