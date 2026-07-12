// src/app/(dashboard)/safety/page.tsx
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SafetyClient } from "./_components/safety-client";

export const metadata: Metadata = { title: "Safety | TransitOps" };

export default async function SafetyPage() {
  const drivers = await prisma.driver.findMany({
    orderBy: { safetyScore: "asc" }, // worst first
    include: {
      _count: { select: { trips: true } },
      user: { select: { email: true } },
    },
  });

  return <SafetyClient drivers={drivers} />;
}
