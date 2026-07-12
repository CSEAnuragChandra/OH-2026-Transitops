// src/app/(dashboard)/expenses/page.tsx
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ExpensesClient } from "./_components/expenses-client";

export const metadata: Metadata = { title: "Expenses | TransitOps" };

export default async function ExpensesPage() {
  const [expenses, trips] = await Promise.all([
    prisma.expense.findMany({
      include: {
        trip: {
          select: { code: true, source: true, destination: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.trip.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, code: true, source: true, destination: true, status: true },
    }),
  ]);

  return <ExpensesClient expenses={expenses} trips={trips} />;
}
