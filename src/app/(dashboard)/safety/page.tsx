// src/app/(dashboard)/safety/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { SafetyClient } from "./_components/safety-client";

export const metadata: Metadata = { title: "Safety | TransitOps" };

export default async function SafetyPage() {
  const session = await auth();
  const role = (session?.user as { role: Role })?.role;
  if (!role || !hasAccess(role, "/safety")) redirect("/unauthorized");

  const drivers = await prisma.driver.findMany({
    orderBy: { safetyScore: "asc" }, // worst first
    include: {
      _count: { select: { trips: true } },
      user: { select: { email: true } },
    },
  });

  return <SafetyClient drivers={drivers} />;
}
