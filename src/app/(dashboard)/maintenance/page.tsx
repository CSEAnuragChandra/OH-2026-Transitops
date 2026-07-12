// src/app/(dashboard)/maintenance/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { MaintenanceClient } from "./_components/maintenance-client";

export const metadata: Metadata = { title: "Maintenance | TransitOps" };

export default async function MaintenancePage() {
  const session = await auth();
  const role = (session?.user as { role: Role })?.role;
  if (!role || !hasAccess(role, "/maintenance")) redirect("/unauthorized");

  const [logs, vehicles] = await Promise.all([
    prisma.maintenanceLog.findMany({
      include: { vehicle: true },
      orderBy: { date: "desc" },
    }),
    prisma.vehicle.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, registrationNumber: true, status: true },
    }),
  ]);

  return <MaintenanceClient logs={logs} vehicles={vehicles} />;
}
