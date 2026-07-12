// src/app/(dashboard)/drivers/page.tsx
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";
import { DriversClient } from "./_components/drivers-client";

export const metadata: Metadata = { title: "Drivers | TransitOps" };

export default async function DriversPage() {
  const session = await auth();
  const role = (session?.user as { role: Role } | undefined)?.role;
  const isManager = role === "FLEET_MANAGER";

  const drivers = await prisma.driver.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { trips: true } },
      user: { select: { email: true } },
    },
  });

  return <DriversClient drivers={drivers} isManager={isManager} />;
}
