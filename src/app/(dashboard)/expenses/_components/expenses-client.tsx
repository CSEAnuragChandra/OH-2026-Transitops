"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { DollarSign, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/ui/export-button";
import { PageTransition } from "@/components/layout/page-transition";
import { ModalForm, FormField, FormInput, FormSelect, FormActions } from "@/components/ui/modal-form";
import { createExpense } from "@/app/actions/expense";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import type { TripStatus } from "@prisma/client";

interface Expense {
  id: string;
  toll: number;
  other: number;
  createdAt: Date;
  trip: { code: string; source: string; destination: string; status: TripStatus };
}

interface Trip {
  id: string;
  code: string;
  source: string;
  destination: string;
  status: TripStatus;
}

interface ExpensesClientProps {
  expenses: Expense[];
  trips: Trip[];
}

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const rowVariants = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } };

const statusBadge: Record<string, "success" | "info" | "warning" | "danger"> = {
  COMPLETED: "success",
  DISPATCHED: "info",
  DRAFT: "warning",
  CANCELLED: "danger",
};

function AddExpenseForm({
  open,
  onOpenChange,
  trips,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  trips: Trip[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await createExpense(new FormData(e.currentTarget));
      toast.success("Expense recorded");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalForm open={open} onOpenChange={onOpenChange} title="Add Trip Expense" description="Record toll and miscellaneous costs for a trip.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Trip">
          <FormSelect name="tripId" required>
            <option value="" disabled>Select trip...</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code}: {t.source} → {t.destination} ({t.status})
              </option>
            ))}
          </FormSelect>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Toll Charges (₹)">
            <FormInput name="toll" type="number" step="1" min="0" placeholder="e.g., 1200" defaultValue="0" />
          </FormField>
          <FormField label="Other Charges (₹)">
            <FormInput name="other" type="number" step="1" min="0" placeholder="e.g., 500" defaultValue="0" />
          </FormField>
        </div>

        <FormActions onCancel={() => onOpenChange(false)} loading={loading} submitLabel="Add Expense" />
      </form>
    </ModalForm>
  );
}

export function ExpensesClient({ expenses, trips }: ExpensesClientProps) {
  const [formOpen, setFormOpen] = useState(false);

  const totalToll = expenses.reduce((s, e) => s + e.toll, 0);
  const totalOther = expenses.reduce((s, e) => s + e.other, 0);
  const grandTotal = totalToll + totalOther;

  const exportData = expenses.map((e) => ({
    "Trip Code": e.trip.code,
    "Route": `${e.trip.source} → ${e.trip.destination}`,
    "Trip Status": e.trip.status,
    "Toll (₹)": e.toll,
    "Other (₹)": e.other,
    "Total (₹)": e.toll + e.other,
  }));

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--fg)" }}>
              <DollarSign className="w-6 h-6 text-emerald-400" />
              Expenses
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
              {expenses.length} entries · Toll: {formatCurrency(totalToll)} · Other: {formatCurrency(totalOther)} · Grand Total: {formatCurrency(grandTotal)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton data={exportData} filename="expenses" />
            <button
              id="add-expense-btn"
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 gradient-brand"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                {["Trip", "Route", "Toll", "Other", "Total", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <motion.tbody variants={containerVariants} initial="hidden" animate="show">
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12" style={{ color: "var(--fg-muted)", background: "var(--bg-card)" }}>
                    No expenses recorded yet.
                  </td>
                </tr>
              )}
              {expenses.map((exp, i) => (
                <motion.tr
                  key={exp.id}
                  variants={rowVariants}
                  className="border-b transition-colors hover:brightness-110"
                  style={{ background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}
                >
                  <td className="px-4 py-3 font-mono font-bold text-xs text-blue-400">{exp.trip.code}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{exp.trip.source}</span>
                    <span className="mx-1.5" style={{ color: "var(--fg-muted)" }}>→</span>
                    <span className="font-medium">{exp.trip.destination}</span>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(exp.toll)}</td>
                  <td className="px-4 py-3">{formatCurrency(exp.other)}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-400">{formatCurrency(exp.toll + exp.other)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadge[exp.trip.status] ?? "default"}>{exp.trip.status}</Badge>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>

        <AddExpenseForm open={formOpen} onOpenChange={setFormOpen} trips={trips} />
      </div>
    </PageTransition>
  );
}
