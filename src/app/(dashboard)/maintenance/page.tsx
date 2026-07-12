// src/app/(dashboard)/maintenance/page.tsx
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { MaintenanceClient } from "./_components/maintenance-client";

export const metadata: Metadata = { title: "Maintenance | TransitOps" };

export default async function MaintenancePage() {
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
