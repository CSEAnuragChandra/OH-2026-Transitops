// src/app/(dashboard)/analytics/page.tsx
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AnalyticsClient } from "./_components/analytics-client";

export const metadata: Metadata = { title: "Analytics | TransitOps" };

export default async function AnalyticsPage() {
  const [
    expenses,
    fuelLogs,
    maintenanceLogs,
    trips,
  ] = await Promise.all([
    prisma.expense.findMany({
      include: { trip: { select: { code: true, source: true, destination: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.fuelLog.findMany({
      include: { vehicle: { select: { name: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.maintenanceLog.findMany({
      include: { vehicle: { select: { name: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.trip.findMany({
      where: { status: { in: ["DISPATCHED", "COMPLETED"] } },
      include: { expenses: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Build monthly breakdown (last 6 months)
  const months: Record<string, { maintenance: number; fuel: number; expenses: number }> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    months[key] = { maintenance: 0, fuel: 0, expenses: 0 };
  }

  maintenanceLogs.forEach((l) => {
    const key = new Date(l.date).toLocaleString("en-IN", { month: "short", year: "2-digit" });
    if (months[key]) months[key].maintenance += l.cost;
  });
  fuelLogs.forEach((l) => {
    const key = new Date(l.date).toLocaleString("en-IN", { month: "short", year: "2-digit" });
    if (months[key]) months[key].fuel += l.cost;
  });
  trips.forEach((t) => {
    const key = new Date(t.createdAt).toLocaleString("en-IN", { month: "short", year: "2-digit" });
    if (months[key]) {
      t.expenses.forEach((e) => { months[key].expenses += e.toll + e.other; });
    }
  });

  const monthlyData = Object.entries(months).map(([month, v]) => ({ month, ...v }));

  // Aggregates
  const totalFuel = fuelLogs.reduce((s, l) => s + l.cost, 0);
  const totalMaintenance = maintenanceLogs.reduce((s, l) => s + l.cost, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.toll + e.other, 0);
  const totalLiters = fuelLogs.reduce((s, l) => s + l.liters, 0);

  // Top spenders by vehicle (fuel)
  const fuelByVehicle: Record<string, number> = {};
  fuelLogs.forEach((l) => {
    const name = l.vehicle.name;
    fuelByVehicle[name] = (fuelByVehicle[name] ?? 0) + l.cost;
  });
  const topFuelVehicles = Object.entries(fuelByVehicle)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, cost]) => ({ name, cost }));

  return (
    <AnalyticsClient
      monthlyData={monthlyData}
      totalFuel={totalFuel}
      totalMaintenance={totalMaintenance}
      totalExpenses={totalExpenses}
      totalLiters={totalLiters}
      topFuelVehicles={topFuelVehicles}
      recentExpenses={expenses.slice(0, 10)}
      recentFuelLogs={fuelLogs.slice(0, 10)}
    />
  );
}
