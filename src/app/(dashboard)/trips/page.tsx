// src/app/(dashboard)/trips/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { TripsClient } from "./_components/trips-client";

export const metadata: Metadata = { title: "Trips | TransitOps" };

export default async function TripsPage() {
  const session = await auth();
  const role = (session?.user as { role: Role })?.role;
  if (!role || !hasAccess(role, "/trips")) redirect("/unauthorized");

  const canDispatch = role === "DISPATCHER" || role === "FLEET_MANAGER";

  const [trips, availableVehicles, availableDrivers] = await Promise.all([
    prisma.trip.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vehicle: { select: { name: true, registrationNumber: true, odometer: true } },
        driver: { select: { name: true } },
        expenses: true,
      },
    }),
    prisma.vehicle.findMany({
      where: { status: "AVAILABLE" },
      select: { id: true, name: true, registrationNumber: true, maxLoadCapacity: true },
      orderBy: { name: "asc" },
    }),
    prisma.driver.findMany({
      where: { status: "AVAILABLE" },
      select: { id: true, name: true, licenseCategory: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Generate next trip code
  const maxCode = trips
    .map((t) => parseInt(t.code.replace(/\D/g, ""), 10))
    .filter((n) => !isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);
  const nextCode = `TR${String(maxCode + 1).padStart(3, "0")}`;

  return (
    <TripsClient
      trips={trips}
      availableVehicles={availableVehicles}
      availableDrivers={availableDrivers}
      canDispatch={canDispatch}
      nextCode={nextCode}
    />
  );
}
