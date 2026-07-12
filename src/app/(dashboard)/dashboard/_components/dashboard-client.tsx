"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CostChart } from "@/components/charts/cost-chart";
import { UtilizationChart } from "@/components/charts/utilization-chart";
import { PageTransition } from "@/components/layout/page-transition";
import { TrendingUp, AlertTriangle, BarChart3, PieChart } from "lucide-react";

interface DashboardClientProps {
  kpis: {
    label: string;
    value: string | number;
    sub: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
  }[];
  recentTrips: {
    id: string;
    code: string;
    source: string;
    destination: string;
    status: string;
    driver?: { name: string } | null;
    vehicle?: { name: string } | null;
  }[];
  expiringLicenses: {
    id: string;
    name: string;
    licenseNumber: string;
    licenseExpiry: Date;
  }[];
  costChartData: { month: string; maintenance: number; fuel: number }[];
  utilizationData: { name: string; value: number; color: string }[];
  role: string;
  tripStatusBadge: Record<string, "success" | "warning" | "info" | "danger" | "default">;
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as Easing },
  },
};

export function DashboardClient({
  kpis,
  recentTrips,
  expiringLicenses,
  costChartData,
  utilizationData,
  role,
  tripStatusBadge,
}: DashboardClientProps) {
  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
            Welcome back — here&apos;s your operations overview.
          </p>
        </div>

        {/* KPI Cards — stagger animation */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {kpis.map((kpi) => (
            <motion.div key={kpi.label} variants={itemVariants}>
              <Card>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs mb-2" style={{ color: "var(--fg-muted)" }}>{kpi.label}</p>
                      <p className="text-2xl font-bold" style={{ color: "var(--fg)" }}>{kpi.value}</p>
                      <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>{kpi.sub}</p>
                    </div>
                    <div className={`${kpi.color} ${kpi.bg} p-2.5 rounded-xl`}>
                      {kpi.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  Monthly Operational Costs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-3">
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--fg-muted)" }}>
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
                    Maintenance
                  </span>
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--fg-muted)" }}>
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" />
                    Fuel
                  </span>
                </div>
                <CostChart data={costChartData} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-purple-400" />
                  Vehicle Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                {utilizationData.length === 0 ? (
                  <div className="flex items-center justify-center h-[220px]" style={{ color: "var(--fg-muted)" }}>
                    <p className="text-sm">No vehicles registered yet</p>
                  </div>
                ) : (
                  <UtilizationChart data={utilizationData} />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Recent Trips */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.3 }}
          >
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
                      <Badge variant={tripStatusBadge[trip.status] ?? "default"}>{trip.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* License Alerts — Fleet Manager + Safety Officer only */}
          {(role === "FLEET_MANAGER" || role === "SAFETY_OFFICER") && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
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
                      <p className="text-sm text-center py-6" style={{ color: "var(--fg-muted)" }}>All licenses are up to date. ✅</p>
                    )}
                    {expiringLicenses.map((driver) => {
                      const daysLeft = Math.ceil(
                        (new Date(driver.licenseExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <div
                          key={driver.id}
                          className="flex items-center justify-between py-2.5 px-3 rounded-lg"
                          style={{ background: "var(--bg)" }}
                        >
                          <div>
                            <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{driver.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{driver.licenseNumber}</p>
                          </div>
                          <Badge variant={daysLeft <= 0 ? "danger" : daysLeft <= 30 ? "danger" : "warning"}>
                            {daysLeft <= 0 ? "EXPIRED" : `${daysLeft}d left`}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
