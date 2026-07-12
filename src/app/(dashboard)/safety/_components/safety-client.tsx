"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Filter, Search, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/ui/export-button";
import { PageTransition } from "@/components/layout/page-transition";
import { differenceInDays } from "date-fns";
import { formatDate } from "@/lib/utils";
import { updateSafetyScore } from "@/app/actions/driver";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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

type ExpiryFilter = "all" | "expired" | "30" | "60" | "90";

const statusBadge: Record<string, "success" | "info" | "warning" | "danger"> = {
  AVAILABLE: "success",
  ON_TRIP: "info",
  OFF_DUTY: "warning",
  SUSPENDED: "danger",
};

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const rowVariants = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } };

export function SafetyClient({ drivers }: { drivers: Driver[] }) {
  const router = useRouter();
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>("all");
  const [search, setSearch] = useState("");

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                          d.licenseNumber.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    const daysLeft = differenceInDays(new Date(d.licenseExpiry), new Date());
    switch (expiryFilter) {
      case "expired": return daysLeft < 0;
      case "30": return daysLeft >= 0 && daysLeft <= 30;
      case "60": return daysLeft >= 0 && daysLeft <= 60;
      case "90": return daysLeft >= 0 && daysLeft <= 90;
      default: return true;
    }
  });

  const atRisk = drivers.filter((d) => d.safetyScore < 70).length;
  const caution = drivers.filter((d) => d.safetyScore >= 70 && d.safetyScore < 90).length;
  const expired = drivers.filter((d) => differenceInDays(new Date(d.licenseExpiry), new Date()) < 0).length;
  const expiringSoon = drivers.filter((d) => {
    const days = differenceInDays(new Date(d.licenseExpiry), new Date());
    return days >= 0 && days <= 30;
  }).length;

  const exportData = filteredDrivers.map((d) => {
    const days = differenceInDays(new Date(d.licenseExpiry), new Date());
    return {
      "Name": d.name,
      "License #": d.licenseNumber,
      "Category": d.licenseCategory,
      "Safety Score": d.safetyScore,
      "License Expiry": formatDate(d.licenseExpiry),
      "Days Until Expiry": days < 0 ? "EXPIRED" : days,
      "Status": d.status,
      "Trips": d._count.trips,
    };
  });

  const filterOptions: { value: ExpiryFilter; label: string }[] = [
    { value: "all", label: "All Drivers" },
    { value: "expired", label: "Expired" },
    { value: "30", label: "Expiring in 30 days" },
    { value: "60", label: "Expiring in 60 days" },
    { value: "90", label: "Expiring in 90 days" },
  ];

  async function handleUpdateScore(id: string, name: string, currentScore: number) {
    const input = prompt(`Enter new safety score (0-100) for ${name}:`, currentScore.toString());
    if (input === null) return;
    const score = parseInt(input, 10);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error("Invalid score. Please enter a number between 0 and 100.");
      return;
    }
    try {
      await updateSafetyScore(id, score);
      toast.success(`Safety score for ${name} updated to ${score}`);
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
              <ShieldCheck className="w-6 h-6 text-green-400" />
              Safety Dashboard
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
              Drivers sorted by safety score — worst first
            </p>
          </div>
          <ExportButton data={exportData} filename="safety" />
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "At Risk (< 70)", value: atRisk, color: "text-red-400", bg: "bg-red-500/10" },
            { label: "Caution (70–89)", value: caution, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Expired Licenses", value: expired, color: "text-red-400", bg: "bg-red-500/10" },
            { label: "Expiring in 30d", value: expiringSoon, color: "text-orange-400", bg: "bg-orange-500/10" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-4 border ${stat.bg}`}
              style={{ borderColor: "var(--border)" }}
            >
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setExpiryFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${expiryFilter === opt.value ? "gradient-brand text-white" : "hover:bg-slate-700"}`}
              style={expiryFilter !== opt.value ? { color: "var(--fg-muted)", background: "var(--bg-card)", border: "1px solid var(--border)" } : {}}
            >
              {opt.label}
            </button>
          ))}
          <div className="flex-1 max-w-sm relative ml-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search drivers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                {["Driver", "Safety Score", "License Expiry", "Days Left", "Status", "Trips", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <motion.tbody variants={containerVariants} initial="hidden" animate="show">
              {filteredDrivers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12" style={{ color: "var(--fg-muted)", background: "var(--bg-card)" }}>
                    No drivers match this filter.
                  </td>
                </tr>
              )}
              {filteredDrivers.map((d, i) => {
                const daysLeft = differenceInDays(new Date(d.licenseExpiry), new Date());
                const expiryVariant = daysLeft < 0 ? "danger" : daysLeft <= 30 ? "danger" : daysLeft <= 90 ? "warning" : "success";

                return (
                  <motion.tr
                    key={d.id}
                    variants={rowVariants}
                    className="border-b transition-colors hover:brightness-110"
                    style={{ background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{d.name}</p>
                      <p className="text-xs font-mono" style={{ color: "var(--fg-muted)" }}>{d.licenseNumber} · {d.licenseCategory}</p>
                    </td>
                    <td className="px-4 py-3">
                      {/* Score bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[80px] h-2 rounded-full bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${d.safetyScore}%`,
                              background: d.safetyScore >= 90 ? "var(--success)" : d.safetyScore >= 70 ? "var(--warning)" : "var(--danger)",
                            }}
                          />
                        </div>
                        <span
                          className="font-bold text-sm"
                          style={{ color: d.safetyScore >= 90 ? "var(--success)" : d.safetyScore >= 70 ? "var(--warning)" : "var(--danger)" }}
                        >
                          {d.safetyScore}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={expiryVariant}>{formatDate(d.licenseExpiry)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${daysLeft < 0 ? "text-red-400" : daysLeft <= 30 ? "text-orange-400" : daysLeft <= 90 ? "text-amber-400" : ""}`}>
                        {daysLeft < 0 ? (
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            EXPIRED
                          </span>
                        ) : `${daysLeft}d`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadge[d.status] ?? "default"}>{d.status}</Badge>
                    </td>
                    <td className="px-4 py-3">{d._count.trips}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleUpdateScore(d.id, d.name, d.safetyScore)}
                        className="p-1.5 rounded-md transition-colors hover:bg-emerald-500/20 text-emerald-400"
                        title="Update Safety Score"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>
      </div>
    </PageTransition>
  );
}
