// src/app/(dashboard)/fuel/page.tsx
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { FuelClient } from "./_components/fuel-client";

export const metadata: Metadata = { title: "Fuel Logs | TransitOps" };

export default async function FuelPage() {
  const [fuelLogs, vehicles, trips] = await Promise.all([
    prisma.fuelLog.findMany({
      include: {
        vehicle: { select: { name: true, registrationNumber: true } },
        trip: { select: { code: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.vehicle.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, registrationNumber: true },
    }),
    prisma.trip.findMany({
      where: { status: { in: ["DISPATCHED", "COMPLETED"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, code: true, source: true, destination: true },
    }),
  ]);

  return <FuelClient fuelLogs={fuelLogs} vehicles={vehicles} trips={trips} />;
}
