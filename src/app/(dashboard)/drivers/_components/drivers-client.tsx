"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Users, AlertTriangle, Pencil, UserX, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/ui/export-button";
import { PageTransition } from "@/components/layout/page-transition";
import { DriverForm } from "./driver-form";
import { deleteDriver } from "@/app/actions/driver";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { differenceInDays } from "date-fns";
import type { DriverStatus } from "@prisma/client";

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: Date;
  contactNumber: string;
  safetyScore: number;
  status: DriverStatus;
  _count: { trips: number };
  user: { email: string } | null;
}

interface DriversClientProps {
  drivers: Driver[];
  isManager: boolean;
}

const statusBadge: Record<string, "success" | "info" | "warning" | "danger"> = {
  AVAILABLE: "success",
  ON_TRIP: "info",
  OFF_DUTY: "warning",
  SUSPENDED: "danger",
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
};

export function DriversClient({ drivers, isManager }: DriversClientProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);

  const exportData = drivers.map((d) => ({
    "Name": d.name,
    "License #": d.licenseNumber,
    "Category": d.licenseCategory,
    "Expiry": formatDate(d.licenseExpiry),
    "Safety Score": d.safetyScore,
    "Trips": d._count.trips,
    "Login Email": d.user?.email ?? "—",
    "Status": d.status,
  }));

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Suspend driver "${name}"? They will be marked as SUSPENDED.`)) return;
    try {
      await deleteDriver(id);
      toast.success(`Driver "${name}" suspended`);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function openEdit(d: Driver) {
    setEditDriver(d);
    setFormOpen(true);
  }

  function openAdd() {
    setEditDriver(null);
    setFormOpen(true);
  }

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
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
          <div className="flex items-center gap-3">
            <ExportButton data={exportData} filename="drivers" />
            {isManager && (
              <button
                id="add-driver-btn"
                onClick={openAdd}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 gradient-brand"
              >
                <Plus className="w-4 h-4" />
                Add Driver
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                {["Name", "License #", "Category", "Expiry", "Safety Score", "Trips", "Login", "Status", ...(isManager ? ["Actions"] : [])].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <motion.tbody variants={containerVariants} initial="hidden" animate="show">
              {drivers.length === 0 && (
                <tr>
                  <td colSpan={isManager ? 9 : 8} className="text-center py-12" style={{ color: "var(--fg-muted)", background: "var(--bg-card)" }}>
                    No drivers registered yet.
                  </td>
                </tr>
              )}
              {drivers.map((d, i) => {
                const daysLeft = differenceInDays(new Date(d.licenseExpiry), new Date());
                const expiryVariant = daysLeft < 0 ? "danger" : daysLeft < 30 ? "danger" : daysLeft < 90 ? "warning" : "success";

                return (
                  <motion.tr
                    key={d.id}
                    variants={rowVariants}
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
                        style={{ color: d.safetyScore >= 90 ? "var(--success)" : d.safetyScore >= 70 ? "var(--warning)" : "var(--danger)" }}
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
                      <motion.span
                        key={d.status}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Badge variant={statusBadge[d.status] ?? "default"}>{d.status}</Badge>
                      </motion.span>
                    </td>
                    {isManager && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(d)}
                            className="p-1.5 rounded-md transition-colors hover:bg-blue-500/20 text-blue-400"
                            title="Edit driver"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {d.status !== "SUSPENDED" && (
                            <button
                              onClick={() => handleDelete(d.id, d.name)}
                              className="p-1.5 rounded-md transition-colors hover:bg-red-500/20 text-red-400"
                              title="Suspend driver"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>

        {/* Modal */}
        <DriverForm
          open={formOpen}
          onOpenChange={setFormOpen}
          editDriver={editDriver}
        />
      </div>
    </PageTransition>
  );
}
