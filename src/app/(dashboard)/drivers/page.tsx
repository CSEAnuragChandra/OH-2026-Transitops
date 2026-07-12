// src/app/(dashboard)/drivers/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Users, AlertTriangle } from "lucide-react";
import { differenceInDays } from "date-fns";
import type { Role } from "@prisma/client";

export const metadata: Metadata = { title: "Drivers" };

const statusBadge: Record<string, "success" | "info" | "warning" | "danger"> = {
  AVAILABLE: "success",
  ON_TRIP: "info",
  OFF_DUTY: "warning",
  SUSPENDED: "danger",
};

export default async function DriversPage() {
  const session = await auth();
  const role = (session?.user as { role: Role })?.role;
  if (!role || !hasAccess(role, "/drivers")) redirect("/unauthorized");
  const drivers = await prisma.driver.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { trips: true } },
      user: { select: { email: true } },
    },
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--fg)" }}>
            <Users className="w-6 h-6 text-emerald-400" />
            Drivers
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
            {drivers.length} driver{drivers.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 gradient-brand"
          disabled
          title="Coming soon"
        >
          + Add Driver
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              {["Name", "License #", "Category", "Expiry", "Safety Score", "Trips", "Login", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12" style={{ color: "var(--fg-muted)", background: "var(--bg-card)" }}>
                  No drivers registered yet.
                </td>
              </tr>
            )}
            {drivers.map((d, i) => {
              const daysLeft = differenceInDays(d.licenseExpiry, new Date());
              const expiryVariant = daysLeft < 0 ? "danger" : daysLeft < 30 ? "danger" : daysLeft < 90 ? "warning" : "success";
              return (
                <tr
                  key={d.id}
                  className="border-b transition-colors hover:brightness-110"
                  style={{
                    background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg)",
                    borderColor: "var(--border)",
                    color: "var(--fg)",
                  }}
                >
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{d.licenseNumber}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--fg-muted)" }}>{d.licenseCategory}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      {daysLeft < 90 && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                      <Badge variant={expiryVariant}>{formatDate(d.licenseExpiry)}</Badge>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="font-bold"
                      style={{
                        color: d.safetyScore >= 90 ? "var(--success)" : d.safetyScore >= 70 ? "var(--warning)" : "var(--danger)",
                      }}
                    >
                      {d.safetyScore}
                    </span>
                    <span className="text-xs ml-1" style={{ color: "var(--fg-muted)" }}>/100</span>
                  </td>
                  <td className="px-4 py-3">{d._count.trips}</td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--fg-muted)" }}>
                    {d.user?.email ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadge[d.status] ?? "default"}>{d.status}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
