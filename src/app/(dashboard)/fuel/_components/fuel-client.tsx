"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Fuel, Plus, Search } from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";
import { PageTransition } from "@/components/layout/page-transition";
import { ModalForm, FormField, FormInput, FormSelect, FormActions } from "@/components/ui/modal-form";
import { createFuelLog } from "@/app/actions/fuel";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";

interface FuelLog {
  id: string;
  date: Date;
  liters: number;
  cost: number;
  vehicle: { name: string; registrationNumber: string };
  trip: { code: string } | null;
}

interface Vehicle {
  id: string;
  name: string;
  registrationNumber: string;
}

interface Trip {
  id: string;
  code: string;
  source: string;
  destination: string;
}

interface FuelClientProps {
  fuelLogs: FuelLog[];
  vehicles: Vehicle[];
  trips: Trip[];
}

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const rowVariants = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } };

function AddFuelForm({
  open,
  onOpenChange,
  vehicles,
  trips,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vehicles: Vehicle[];
  trips: Trip[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await createFuelLog(new FormData(e.currentTarget));
      toast.success("Fuel log recorded");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <ModalForm open={open} onOpenChange={onOpenChange} title="Log Fuel Entry" description="Record fuel filled for a vehicle, optionally tied to a trip.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Vehicle">
          <FormSelect name="vehicleId" required>
            <option value="" disabled>Select vehicle...</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>
            ))}
          </FormSelect>
        </FormField>

        <FormField label="Trip (Optional)">
          <FormSelect name="tripId">
            <option value="">No trip linked</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>{t.code}: {t.source} → {t.destination}</option>
            ))}
          </FormSelect>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Liters">
            <FormInput name="liters" type="number" step="0.1" min="0.1" placeholder="e.g., 80" required />
          </FormField>
          <FormField label="Total Cost (₹)">
            <FormInput name="cost" type="number" step="1" min="1" placeholder="e.g., 9200" required />
          </FormField>
        </div>

        <FormField label="Date">
          <FormInput name="date" type="date" required defaultValue={today} />
        </FormField>

        <FormActions onCancel={() => onOpenChange(false)} loading={loading} submitLabel="Log Fuel" />
      </form>
    </ModalForm>
  );
}

export function FuelClient({ fuelLogs, vehicles, trips }: FuelClientProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredLogs = fuelLogs.filter((l) => 
    l.vehicle.name.toLowerCase().includes(search.toLowerCase()) ||
    l.vehicle.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
    (l.trip?.code && l.trip.code.toLowerCase().includes(search.toLowerCase()))
  );

  const totalLiters = filteredLogs.reduce((s, l) => s + l.liters, 0);
  const totalCost = filteredLogs.reduce((s, l) => s + l.cost, 0);

  const exportData = filteredLogs.map((l) => ({
    "Vehicle": l.vehicle.name,
    "Reg #": l.vehicle.registrationNumber,
    "Trip": l.trip?.code ?? "—",
    "Date": formatDate(l.date),
    "Liters": l.liters,
    "Cost/Liter (₹)": (l.cost / l.liters).toFixed(2),
    "Total Cost (₹)": l.cost,
  }));

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--fg)" }}>
              <Fuel className="w-6 h-6 text-cyan-400" />
              Fuel Logs
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
              {filteredLogs.length} entries · {totalLiters.toFixed(1)}L total · {formatCurrency(totalCost)} spent
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}
              />
            </div>
            <ExportButton data={exportData} filename="fuel-logs" />
            <button
              id="add-fuel-btn"
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 gradient-brand"
            >
              <Plus className="w-4 h-4" />
              Log Fuel
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                {["Vehicle", "Trip", "Date", "Liters", "Cost/Liter", "Total Cost"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <motion.tbody variants={containerVariants} initial="hidden" animate="show">
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12" style={{ color: "var(--fg-muted)", background: "var(--bg-card)" }}>
                    No fuel logs found.
                  </td>
                </tr>
              )}
              {filteredLogs.map((log, i) => (
                <motion.tr
                  key={log.id}
                  variants={rowVariants}
                  className="border-b transition-colors hover:brightness-110"
                  style={{ background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{log.vehicle.name}</p>
                    <p className="text-xs font-mono" style={{ color: "var(--fg-muted)" }}>{log.vehicle.registrationNumber}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-400">{log.trip?.code ?? "—"}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--fg-muted)" }}>{formatDate(log.date)}</td>
                  <td className="px-4 py-3 font-semibold text-cyan-400">{log.liters}L</td>
                  <td className="px-4 py-3" style={{ color: "var(--fg-muted)" }}>
                    ₹{(log.cost / log.liters).toFixed(2)}/L
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(log.cost)}</td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>

        <AddFuelForm open={formOpen} onOpenChange={setFormOpen} vehicles={vehicles} trips={trips} />
      </div>
    </PageTransition>
  );
}
