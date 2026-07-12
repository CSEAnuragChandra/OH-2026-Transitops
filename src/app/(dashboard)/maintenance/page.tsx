// src/app/(dashboard)/maintenance/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAccess } from "@/lib/rbac";
import { Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Role } from "@prisma/client";

export const metadata: Metadata = { title: "Maintenance" };

export default async function MaintenancePage() {
  const session = await auth();
  const role = (session?.user as { role: Role })?.role;
  if (!role || !hasAccess(role, "/maintenance")) redirect("/unauthorized");
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--fg)" }}>
          <Wrench className="w-6 h-6 text-amber-400" />
          Maintenance Logs
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
          Track vehicle maintenance and repair history
        </p>
      </div>
      <Card>
        <CardContent className="text-center py-16">
          <Wrench className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="font-semibold text-lg" style={{ color: "var(--fg)" }}>Coming Soon</p>
          <p className="text-sm mt-2" style={{ color: "var(--fg-muted)" }}>
            Maintenance log management — assigned to team member 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
