// src/app/(dashboard)/trips/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Route } from "lucide-react";
import type { Role } from "@prisma/client";

export const metadata: Metadata = { title: "Trips" };

const statusBadge: Record<string, "success" | "info" | "warning" | "danger" | "default"> = {
  COMPLETED: "success",
  DISPATCHED: "info",
  DRAFT: "warning",
  CANCELLED: "danger",
};

export default async function TripsPage() {
  const session = await auth();
  const role = (session?.user as { role: Role })?.role;
  if (!role || !hasAccess(role, "/trips")) redirect("/unauthorized");
  const trips = await prisma.trip.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: { select: { name: true, registrationNumber: true } },
      driver: { select: { name: true } },
      expenses: true,
    },
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--fg)" }}>
            <Route className="w-6 h-6 text-purple-400" />
            Trips
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
            {trips.length} trip{trips.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 gradient-brand"
          disabled
          title="Coming soon"
        >
          + New Trip
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              {["Code", "Route", "Cargo (T)", "Distance", "Driver", "Vehicle", "Created", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trips.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12" style={{ color: "var(--fg-muted)", background: "var(--bg-card)" }}>
                  No trips yet.
                </td>
              </tr>
            )}
            {trips.map((t, i) => (
              <tr
                key={t.id}
                className="border-b transition-colors hover:brightness-110"
                style={{
                  background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg)",
                  borderColor: "var(--border)",
                  color: "var(--fg)",
                }}
              >
                <td className="px-4 py-3 font-mono font-bold text-xs text-blue-400">{t.code}</td>
                <td className="px-4 py-3">
                  <span className="font-medium">{t.source}</span>
                  <span className="mx-1.5" style={{ color: "var(--fg-muted)" }}>→</span>
                  <span className="font-medium">{t.destination}</span>
                </td>
                <td className="px-4 py-3">{t.cargoWeight}</td>
                <td className="px-4 py-3">{t.plannedDistance} km</td>
                <td className="px-4 py-3" style={{ color: "var(--fg-muted)" }}>{t.driver?.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--fg-muted)" }}>
                  {t.vehicle?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--fg-muted)" }}>
                  {formatDate(t.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusBadge[t.status] ?? "default"}>{t.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
