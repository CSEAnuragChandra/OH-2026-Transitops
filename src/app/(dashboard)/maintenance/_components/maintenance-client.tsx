"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Wrench, Plus, CheckCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/ui/export-button";
import { PageTransition } from "@/components/layout/page-transition";
import { ModalForm, FormField, FormInput, FormSelect, FormActions } from "@/components/ui/modal-form";
import { createMaintenanceLog, completeMaintenanceLog } from "@/app/actions/maintenance";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { VehicleStatus } from "@prisma/client";

interface Log {
  id: string;
  description: string;
  cost: number;
  date: Date;
  status: string;
  vehicleId: string;
  vehicle: { id: string; name: string; registrationNumber: string };
}

interface Vehicle {
  id: string;
  name: string;
  registrationNumber: string;
  status: VehicleStatus;
}

interface MaintenanceClientProps {
  logs: Log[];
  vehicles: Vehicle[];
}

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const rowVariants = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } };

function AddLogForm({
  open,
  onOpenChange,
  vehicles,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vehicles: Vehicle[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await createMaintenanceLog(new FormData(e.currentTarget));
      toast.success("Maintenance log created — vehicle marked IN_SHOP");
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
    <ModalForm open={open} onOpenChange={onOpenChange} title="Add Maintenance Log" description="Logging maintenance will mark the vehicle as IN_SHOP.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Vehicle">
          <FormSelect name="vehicleId" required>
            <option value="" disabled>Select vehicle...</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.registrationNumber}) — {v.status}
              </option>
            ))}
          </FormSelect>
        </FormField>

        <FormField label="Description">
          <FormInput name="description" placeholder="e.g., Engine overhaul" required />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Cost (₹)">
            <FormInput name="cost" type="number" step="1" min="0" placeholder="e.g., 15000" required />
          </FormField>
          <FormField label="Date">
            <FormInput name="date" type="date" required defaultValue={today} />
          </FormField>
        </div>

        <FormActions onCancel={() => onOpenChange(false)} loading={loading} submitLabel="Add Log" />
      </form>
    </ModalForm>
  );
}

export function MaintenanceClient({ logs, vehicles }: MaintenanceClientProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredLogs = logs.filter((l) => 
    l.vehicle.name.toLowerCase().includes(search.toLowerCase()) ||
    l.vehicle.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
    l.description.toLowerCase().includes(search.toLowerCase())
  );

  const totalCost = filteredLogs.reduce((s, l) => s + l.cost, 0);
  const inShop = filteredLogs.filter((l) => l.status === "In Shop").length;

  const exportData = filteredLogs.map((l) => ({
    "Vehicle": l.vehicle.name,
    "Reg #": l.vehicle.registrationNumber,
    "Description": l.description,
    "Cost (₹)": l.cost,
    "Date": formatDate(l.date),
    "Status": l.status,
  }));

  async function handleComplete(log: Log) {
    try {
      await completeMaintenanceLog(log.id, log.vehicleId);
      toast.success(`Maintenance completed — ${log.vehicle.name} is now AVAILABLE`);
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
              <Wrench className="w-6 h-6 text-amber-400" />
              Maintenance Logs
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
              {filteredLogs.length} log{filteredLogs.length !== 1 ? "s" : ""} · Total: {formatCurrency(totalCost)} · {inShop} in shop
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
            <ExportButton data={exportData} filename="maintenance" />
            <button
              id="add-maintenance-btn"
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 gradient-brand"
            >
              <Plus className="w-4 h-4" />
              Add Log
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                {["Vehicle", "Description", "Cost", "Date", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <motion.tbody variants={containerVariants} initial="hidden" animate="show">
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12" style={{ color: "var(--fg-muted)", background: "var(--bg-card)" }}>
                    No maintenance logs found.
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
                  <td className="px-4 py-3">{log.description}</td>
                  <td className="px-4 py-3 font-semibold text-amber-400">{formatCurrency(log.cost)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--fg-muted)" }}>{formatDate(log.date)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={log.status === "Completed" ? "success" : "warning"}>
                      {log.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {log.status === "In Shop" && (
                      <button
                        onClick={() => handleComplete(log)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-emerald-500/20 text-emerald-400"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Mark Done
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>

        <AddLogForm open={formOpen} onOpenChange={setFormOpen} vehicles={vehicles} />
      </div>
    </PageTransition>
  );
}
