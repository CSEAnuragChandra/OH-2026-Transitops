// src/app/(dashboard)/dashboard/page.tsx
import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Users, Route, Wrench, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DashboardClient } from "./_components/dashboard-client";
import type { Role } from "@prisma/client";

export const metadata: Metadata = { title: "Dashboard | TransitOps" };

async function getDashboardData() {
  const [
    vehicleStats,
    driverStats,
    tripStats,
    maintenanceStats,
    fuelStats,
    recentTrips,
    expiringLicenses,
    maintenanceLogs,
    fuelLogs,
  ] = await Promise.all([
    prisma.vehicle.groupBy({ by: ["status"], _count: true }),
    prisma.driver.groupBy({ by: ["status"], _count: true }),
    prisma.trip.groupBy({ by: ["status"], _count: true }),
    prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
    prisma.fuelLog.aggregate({ _sum: { cost: true } }),
    prisma.trip.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { vehicle: true, driver: true },
    }),
    prisma.driver.findMany({
      where: {
        licenseExpiry: {
          lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { licenseExpiry: "asc" },
      take: 5,
    }),
    // For cost chart
    prisma.maintenanceLog.findMany({
      select: { cost: true, date: true },
      orderBy: { date: "asc" },
    }),
    prisma.fuelLog.findMany({
      select: { cost: true, date: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const totalVehicles = vehicleStats.reduce((s, g) => s + g._count, 0);
  const activeVehicles = vehicleStats.find((g) => g.status === "ON_TRIP")?._count ?? 0;
  const availableVehicles = vehicleStats.find((g) => g.status === "AVAILABLE")?._count ?? 0;
  const inShopVehicles = vehicleStats.find((g) => g.status === "IN_SHOP")?._count ?? 0;
  const retiredVehicles = vehicleStats.find((g) => g.status === "RETIRED")?._count ?? 0;
  const availableDrivers = driverStats.find((g) => g.status === "AVAILABLE")?._count ?? 0;
  const activeTrips = tripStats.find((g) => g.status === "DISPATCHED")?._count ?? 0;
  const maintenanceCost = maintenanceStats._sum.cost ?? 0;
  const fuelCost = fuelStats._sum.cost ?? 0;

  // Build monthly cost data for chart (last 6 months)
  const months: Record<string, { maintenance: number; fuel: number }> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    months[key] = { maintenance: 0, fuel: 0 };
  }

  maintenanceLogs.forEach((log) => {
    const key = new Date(log.date).toLocaleString("en-IN", { month: "short", year: "2-digit" });
    if (months[key]) months[key].maintenance += log.cost;
  });

  fuelLogs.forEach((log) => {
    const key = new Date(log.date).toLocaleString("en-IN", { month: "short", year: "2-digit" });
    if (months[key]) months[key].fuel += log.cost;
  });

  const costChartData = Object.entries(months).map(([month, costs]) => ({
    month,
    ...costs,
  }));

  const utilizationData = [
    { name: "Available", value: availableVehicles, color: "#10b981" },
    { name: "On Trip", value: activeVehicles, color: "#3b82f6" },
    { name: "In Shop", value: inShopVehicles, color: "#f59e0b" },
    { name: "Retired", value: retiredVehicles, color: "#64748b" },
  ].filter((d) => d.value > 0);

  return {
    totalVehicles,
    activeVehicles,
    availableDrivers,
    activeTrips,
    maintenanceCost,
    fuelCost,
    recentTrips,
    expiringLicenses,
    costChartData,
    utilizationData,
  };
}

const tripStatusBadge: Record<string, "success" | "warning" | "info" | "danger" | "default"> = {
  COMPLETED: "success",
  DISPATCHED: "info",
  DRAFT: "warning",
  CANCELLED: "danger",
};

export default async function DashboardPage() {
  const session = await auth();
  const role = (session?.user as { role: Role }).role;
  const {
    totalVehicles,
    activeVehicles,
    availableDrivers,
    activeTrips,
    maintenanceCost,
    fuelCost,
    recentTrips,
    expiringLicenses,
    costChartData,
    utilizationData,
  } = await getDashboardData();

  const kpis = [
    { label: "Total Vehicles", value: totalVehicles, sub: `${activeVehicles} on trip`, icon: <Truck className="w-5 h-5" />, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Available Drivers", value: availableDrivers, sub: "Ready to dispatch", icon: <Users className="w-5 h-5" />, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Active Trips", value: activeTrips, sub: "Currently dispatched", icon: <Route className="w-5 h-5" />, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Total Op. Cost", value: formatCurrency(maintenanceCost + fuelCost), sub: "Maintenance + Fuel", icon: <Wrench className="w-5 h-5" />, color: "text-amber-400", bg: "bg-amber-500/10" },
  ];

  return (
    <DashboardClient
      kpis={kpis}
      recentTrips={recentTrips}
      expiringLicenses={expiringLicenses}
      costChartData={costChartData}
      utilizationData={utilizationData}
      role={role}
      tripStatusBadge={tripStatusBadge}
    />
  );
}
