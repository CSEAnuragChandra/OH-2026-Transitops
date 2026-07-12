// src/app/(dashboard)/dashboard/page.tsx
import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Users, Route, Wrench, TrendingUp, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Role } from "@prisma/client";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardData() {
  const [
    vehicleStats,
    driverStats,
    tripStats,
    maintenanceStats,
    recentTrips,
    expiringLicenses,
  ] = await Promise.all([
    prisma.vehicle.groupBy({ by: ["status"], _count: true }),
    prisma.driver.groupBy({ by: ["status"], _count: true }),
    prisma.trip.groupBy({ by: ["status"], _count: true }),
    prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
    prisma.trip.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { vehicle: true, driver: true },
    }),
    prisma.driver.findMany({
      where: {
        licenseExpiry: {
          lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // within 90 days
        },
      },
      orderBy: { licenseExpiry: "asc" },
      take: 5,
    }),
  ]);

  const totalVehicles = vehicleStats.reduce((s, g) => s + g._count, 0);
  const activeVehicles = vehicleStats.find((g) => g.status === "ON_TRIP")?._count ?? 0;
  const availableDrivers = driverStats.find((g) => g.status === "AVAILABLE")?._count ?? 0;
  const activeTrips = tripStats.find((g) => g.status === "DISPATCHED")?._count ?? 0;
  const maintenanceCost = maintenanceStats._sum.cost ?? 0;

  return { totalVehicles, activeVehicles, availableDrivers, activeTrips, maintenanceCost, recentTrips, expiringLicenses };
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
  const { totalVehicles, activeVehicles, availableDrivers, activeTrips, maintenanceCost, recentTrips, expiringLicenses } =
    await getDashboardData();

  const kpis = [
    { label: "Total Vehicles", value: totalVehicles, sub: `${activeVehicles} on trip`, icon: <Truck className="w-5 h-5" />, color: "text-blue-400" },
    { label: "Available Drivers", value: availableDrivers, sub: "Ready to dispatch", icon: <Users className="w-5 h-5" />, color: "text-emerald-400" },
    { label: "Active Trips", value: activeTrips, sub: "Currently dispatched", icon: <Route className="w-5 h-5" />, color: "text-purple-400" },
    { label: "Maintenance Cost", value: formatCurrency(maintenanceCost), sub: "All time", icon: <Wrench className="w-5 h-5" />, color: "text-amber-400" },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
          Welcome back — here&apos;s your operations overview.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs mb-2" style={{ color: "var(--fg-muted)" }}>{kpi.label}</p>
                  <p className="text-2xl font-bold" style={{ color: "var(--fg)" }}>{kpi.value}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>{kpi.sub}</p>
                </div>
                <div className={`${kpi.color} p-2 rounded-lg bg-slate-800`}>{kpi.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Recent Trips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Recent Trips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTrips.length === 0 && (
                <p className="text-sm text-center py-6" style={{ color: "var(--fg-muted)" }}>No trips yet.</p>
              )}
              {recentTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg"
                  style={{ background: "var(--bg)" }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>
                      {trip.code}: {trip.source} → {trip.destination}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
                      {trip.driver?.name ?? "Unassigned"} · {trip.vehicle?.name ?? "No vehicle"}
                    </p>
                  </div>
                  <Badge variant={tripStatusBadge[trip.status] ?? "default"}>
                    {trip.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expiring Licenses — shown to Fleet Manager and Safety Officer */}
        {(role === "FLEET_MANAGER" || role === "SAFETY_OFFICER") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                License Expiry Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expiringLicenses.length === 0 && (
                  <p className="text-sm text-center py-6" style={{ color: "var(--fg-muted)" }}>
                    All licenses are up to date. ✅
                  </p>
                )}
                {expiringLicenses.map((driver) => {
                  const daysLeft = Math.ceil(
                    (driver.licenseExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={driver.id}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg"
                      style={{ background: "var(--bg)" }}
                    >
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>
                          {driver.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
                          {driver.licenseNumber}
                        </p>
                      </div>
                      <Badge variant={daysLeft <= 30 ? "danger" : "warning"}>
                        {daysLeft <= 0 ? "EXPIRED" : `${daysLeft}d left`}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
