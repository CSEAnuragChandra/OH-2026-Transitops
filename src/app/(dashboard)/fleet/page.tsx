// src/app/(dashboard)/fleet/page.tsx
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";
import { FleetClient } from "./_components/fleet-client";

export const metadata: Metadata = { title: "Fleet Registry | TransitOps" };

export default async function FleetPage() {
  const session = await auth();
  const role = (session?.user as { role: Role } | undefined)?.role;
  const isManager = role === "FLEET_MANAGER";

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { trips: true } },
    },
  });

  return <FleetClient vehicles={vehicles} isManager={isManager} />;
}
