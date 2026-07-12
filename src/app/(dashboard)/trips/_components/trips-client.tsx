"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Route, Plus, Send, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/ui/export-button";
import { PageTransition } from "@/components/layout/page-transition";
import { TripForm } from "./trip-form";
import { DispatchForm } from "./dispatch-form";
import { CompleteTripForm } from "./complete-form";
import { cancelTrip } from "@/app/actions/trip";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import type { TripStatus } from "@prisma/client";

interface Trip {
  id: string;
  code: string;
  source: string;
  destination: string;
  cargoWeight: number;
  plannedDistance: number;
  status: TripStatus;
  finalOdometer?: number | null;
  fuelConsumed?: number | null;
  createdAt: Date;
  vehicle?: { name: string; registrationNumber: string; odometer: number } | null;
  driver?: { name: string } | null;
  expenses: { toll: number; other: number }[];
}

interface TripsClientProps {
  trips: Trip[];
  availableVehicles: { id: string; name: string; registrationNumber: string; maxLoadCapacity: number }[];
  availableDrivers: { id: string; name: string; licenseCategory: string }[];
  canDispatch: boolean;
  nextCode: string;
}

const statusBadge: Record<string, "success" | "info" | "warning" | "danger" | "default"> = {
  COMPLETED: "success",
  DISPATCHED: "info",
  DRAFT: "warning",
  CANCELLED: "danger",
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
};

export function TripsClient({
  trips,
  availableVehicles,
  availableDrivers,
  canDispatch,
  nextCode,
}: TripsClientProps) {
  const router = useRouter();
  const [tripFormOpen, setTripFormOpen] = useState(false);
  const [dispatchTrip, setDispatchTrip] = useState<Trip | null>(null);
  const [completeTrip, setCompleteTrip] = useState<Trip | null>(null);

  const exportData = trips.map((t) => ({
    "Code": t.code,
    "Source": t.source,
    "Destination": t.destination,
    "Cargo (T)": t.cargoWeight,
    "Distance (km)": t.plannedDistance,
    "Driver": t.driver?.name ?? "—",
    "Vehicle": t.vehicle?.name ?? "—",
    "Status": t.status,
    "Created": formatDate(t.createdAt),
    "Final Odometer": t.finalOdometer ?? "—",
    "Fuel Consumed (L)": t.fuelConsumed ?? "—",
  }));

  async function handleCancel(id: string, code: string) {
    if (!confirm(`Cancel trip ${code}? This will free the vehicle and driver.`)) return;
    try {
      await cancelTrip(id);
      toast.success(`Trip ${code} cancelled`);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
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
          <div className="flex items-center gap-3">
            <ExportButton data={exportData} filename="trips" />
            {canDispatch && (
              <button
                id="new-trip-btn"
                onClick={() => setTripFormOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 gradient-brand"
              >
                <Plus className="w-4 h-4" />
                New Trip
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                {["Code", "Route", "Cargo", "Distance", "Driver", "Vehicle", "Date", "Status", ...(canDispatch ? ["Actions"] : [])].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <motion.tbody variants={containerVariants} initial="hidden" animate="show">
              {trips.length === 0 && (
                <tr>
                  <td colSpan={canDispatch ? 9 : 8} className="text-center py-12" style={{ color: "var(--fg-muted)", background: "var(--bg-card)" }}>
                    No trips yet.
                  </td>
                </tr>
              )}
              {trips.map((t, i) => (
                <motion.tr
                  key={t.id}
                  variants={rowVariants}
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
                  <td className="px-4 py-3">{t.cargoWeight}T</td>
                  <td className="px-4 py-3">{t.plannedDistance} km</td>
                  <td className="px-4 py-3" style={{ color: "var(--fg-muted)" }}>{t.driver?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--fg-muted)" }}>{t.vehicle?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--fg-muted)" }}>{formatDate(t.createdAt)}</td>
                  <td className="px-4 py-3">
                    <motion.span
                      key={t.status}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Badge variant={statusBadge[t.status] ?? "default"}>{t.status}</Badge>
                    </motion.span>
                  </td>
                  {canDispatch && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {t.status === "DRAFT" && (
                          <button
                            onClick={() => setDispatchTrip(t)}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-blue-500/20 text-blue-400"
                            title="Dispatch"
                          >
                            <Send className="w-3 h-3" />
                            Dispatch
                          </button>
                        )}
                        {t.status === "DISPATCHED" && (
                          <button
                            onClick={() => setCompleteTrip(t)}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-emerald-500/20 text-emerald-400"
                            title="Complete"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Complete
                          </button>
                        )}
                        {(t.status === "DRAFT" || t.status === "DISPATCHED") && (
                          <button
                            onClick={() => handleCancel(t.id, t.code)}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-red-500/20 text-red-400"
                            title="Cancel"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>

        {/* Modals */}
        <TripForm open={tripFormOpen} onOpenChange={setTripFormOpen} nextCode={nextCode} />

        {dispatchTrip && (
          <DispatchForm
            open={!!dispatchTrip}
            onOpenChange={(open) => !open && setDispatchTrip(null)}
            trip={dispatchTrip}
            availableVehicles={availableVehicles}
            availableDrivers={availableDrivers}
          />
        )}

        {completeTrip && (
          <CompleteTripForm
            open={!!completeTrip}
            onOpenChange={(open) => !open && setCompleteTrip(null)}
            trip={{ ...completeTrip, vehicle: completeTrip.vehicle ? { ...completeTrip.vehicle } : null }}
          />
        )}
      </div>
    </PageTransition>
  );
}
