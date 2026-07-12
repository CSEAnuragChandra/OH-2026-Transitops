"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Truck, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/ui/export-button";
import { PageTransition } from "@/components/layout/page-transition";
import { VehicleForm } from "./vehicle-form";
import { deleteVehicle } from "@/app/actions/vehicle";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import type { VehicleStatus } from "@prisma/client";

interface Vehicle {
  id: string;
  registrationNumber: string;
  name: string;
  type: string;
  maxLoadCapacity: number;
  acquisitionCost: number;
  odometer: number;
  status: VehicleStatus;
  _count: { trips: number };
}

interface FleetClientProps {
  vehicles: Vehicle[];
  isManager: boolean;
}

const statusBadge: Record<string, "success" | "info" | "warning" | "danger"> = {
  AVAILABLE: "success",
  ON_TRIP: "info",
  IN_SHOP: "warning",
  RETIRED: "danger",
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
};

export function FleetClient({ vehicles, isManager }: FleetClientProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [search, setSearch] = useState("");

  const filteredVehicles = vehicles.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.registrationNumber.toLowerCase().includes(search.toLowerCase())
  );

  const exportData = filteredVehicles.map((v) => ({
    "Registration": v.registrationNumber,
    "Name": v.name,
    "Type": v.type,
    "Max Load (T)": v.maxLoadCapacity,
    "Odometer (km)": v.odometer,
    "Acquisition Cost (₹)": v.acquisitionCost,
    "Trips": v._count.trips,
    "Status": v.status,
  }));

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Retire vehicle "${name}"? This sets its status to RETIRED.`)) return;
    try {
      await deleteVehicle(id);
      toast.success(`Vehicle "${name}" retired`);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function openEdit(v: Vehicle) {
    setEditVehicle(v);
    setFormOpen(true);
  }

  function openAdd() {
    setEditVehicle(null);
    setFormOpen(true);
  }

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--fg)" }}>
              <Truck className="w-6 h-6 text-blue-400" />
              Fleet Registry
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
              {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search fleet..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}
              />
            </div>
            <ExportButton data={exportData} filename="fleet" />
            {isManager && (
              <button
                id="add-vehicle-btn"
                onClick={openAdd}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 gradient-brand"
              >
                <Plus className="w-4 h-4" />
                Add Vehicle
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                {["Registration", "Name", "Type", "Max Load", "Odometer", "Acq. Cost", "Trips", "Status", ...(isManager ? ["Actions"] : [])].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <motion.tbody variants={containerVariants} initial="hidden" animate="show">
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={isManager ? 9 : 8} className="text-center py-12" style={{ color: "var(--fg-muted)", background: "var(--bg-card)" }}>
                    No vehicles found.{isManager ? " Click 'Add Vehicle' to register one." : ""}
                  </td>
                </tr>
              )}
              {filteredVehicles.map((v, i) => (
                <motion.tr
                  key={v.id}
                  variants={rowVariants}
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
                    <motion.span
                      key={v.status}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Badge variant={statusBadge[v.status] ?? "default"}>{v.status}</Badge>
                    </motion.span>
                  </td>
                  {isManager && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(v)}
                          className="p-1.5 rounded-md transition-colors hover:bg-blue-500/20 text-blue-400"
                          title="Edit vehicle"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {v.status !== "RETIRED" && (
                          <button
                            onClick={() => handleDelete(v.id, v.name)}
                            className="p-1.5 rounded-md transition-colors hover:bg-red-500/20 text-red-400"
                            title="Retire vehicle"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Modal */}
        <VehicleForm
          open={formOpen}
          onOpenChange={setFormOpen}
          editVehicle={editVehicle}
        />
      </div>
    </PageTransition>
  );
}
