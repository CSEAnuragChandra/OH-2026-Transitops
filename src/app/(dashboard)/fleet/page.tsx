// src/app/(dashboard)/fleet/page.tsx
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Truck, Plus } from "lucide-react";

export const metadata: Metadata = { title: "Fleet" };

const statusBadge: Record<string, "success" | "info" | "warning" | "danger"> = {
  AVAILABLE: "success",
  ON_TRIP: "info",
  IN_SHOP: "warning",
  RETIRED: "danger",
};

export default async function FleetPage() {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { trips: true } },
    },
  });

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--fg)" }}>
            <Truck className="w-6 h-6 text-blue-400" />
            Fleet Registry
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
            {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        {/* TODO: Add Vehicle button — wire up in next phase */}
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 gradient-brand"
          disabled
          title="Coming soon"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              {["Registration", "Name", "Type", "Max Load", "Odometer", "Acq. Cost", "Trips", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12" style={{ color: "var(--fg-muted)", background: "var(--bg-card)" }}>
                  No vehicles found. Add your first vehicle.
                </td>
              </tr>
            )}
            {vehicles.map((v, i) => (
              <tr
                key={v.id}
                className="border-b transition-colors hover:brightness-110"
                style={{
                  background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg)",
                  borderColor: "var(--border)",
                  color: "var(--fg)",
                }}
              >
                <td className="px-4 py-3 font-mono text-xs">{v.registrationNumber}</td>
                <td className="px-4 py-3 font-medium">{v.name}</td>
                <td className="px-4 py-3" style={{ color: "var(--fg-muted)" }}>{v.type}</td>
                <td className="px-4 py-3">{v.maxLoadCapacity} T</td>
                <td className="px-4 py-3">{v.odometer.toLocaleString()} km</td>
                <td className="px-4 py-3">{formatCurrency(v.acquisitionCost)}</td>
                <td className="px-4 py-3">{v._count.trips}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusBadge[v.status] ?? "default"}>{v.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
