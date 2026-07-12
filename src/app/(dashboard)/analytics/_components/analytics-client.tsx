"use client";

import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { BarChart3, Fuel, Wrench, DollarSign, TrendingUp, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButton } from "@/components/ui/export-button";
import { PageTransition } from "@/components/layout/page-transition";
import { formatCurrency, formatDate } from "@/lib/utils";

interface MonthlyData {
  month: string;
  maintenance: number;
  fuel: number;
  expenses: number;
}

interface AnalyticsClientProps {
  monthlyData: MonthlyData[];
  totalFuel: number;
  totalMaintenance: number;
  totalExpenses: number;
  totalLiters: number;
  topFuelVehicles: { name: string; cost: number }[];
  recentExpenses: {
    id: string;
    toll: number;
    other: number;
    trip: { code: string; source: string; destination: string };
  }[];
  recentFuelLogs: {
    id: string;
    date: Date;
    liters: number;
    cost: number;
    vehicle: { name: string };
  }[];
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function AnalyticsClient({
  monthlyData,
  totalFuel,
  totalMaintenance,
  totalExpenses,
  totalLiters,
  topFuelVehicles,
  recentExpenses,
  recentFuelLogs,
}: AnalyticsClientProps) {
  const grandTotal = totalFuel + totalMaintenance + totalExpenses;

  const kpis = [
    {
      label: "Total Fuel Cost",
      value: formatCurrency(totalFuel),
      sub: `${totalLiters.toFixed(0)}L consumed`,
      icon: <Fuel className="w-5 h-5" />,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      label: "Total Maintenance",
      value: formatCurrency(totalMaintenance),
      sub: "All time",
      icon: <Wrench className="w-5 h-5" />,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Total Expenses",
      value: formatCurrency(totalExpenses),
      sub: "Tolls + Other",
      icon: <DollarSign className="w-5 h-5" />,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Grand Total OpEx",
      value: formatCurrency(grandTotal),
      sub: "Fuel + Maint + Expenses",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  const exportMonthly = monthlyData.map((m) => ({
    Month: m.month,
    "Maintenance (₹)": m.maintenance,
    "Fuel (₹)": m.fuel,
    "Expenses (₹)": m.expenses,
    "Total (₹)": m.maintenance + m.fuel + m.expenses,
  }));

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

  function downloadMonthlyReport() {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("TRANSITOPS — MONTHLY EXPENSE REPORT", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 120, 20);

    // Summary
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("OVERALL SUMMARY", 14, 35);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Fuel Cost:      ${formatCurrency(totalFuel)}`, 14, 45);
    doc.text(`Total Maintenance:    ${formatCurrency(totalMaintenance)}`, 14, 52);
    doc.text(`Total Trip Expenses:  ${formatCurrency(totalExpenses)}`, 14, 59);
    
    doc.setFont("helvetica", "bold");
    doc.text(`GRAND TOTAL OPEX:     ${formatCurrency(grandTotal)}`, 14, 66);

    // Table
    doc.setFontSize(14);
    doc.text("MONTHLY BREAKDOWN (Last 6 Months)", 14, 85);

    const tableData = monthlyData.map(m => [
      m.month,
      formatCurrency(m.fuel),
      formatCurrency(m.maintenance),
      formatCurrency(m.expenses),
      formatCurrency(m.maintenance + m.fuel + m.expenses)
    ]);

    autoTable(doc, {
      startY: 90,
      head: [["Month", "Fuel", "Maintenance", "Expenses", "Total"]],
      body: tableData,
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("TransitOps — Smart Transport Operations Platform", 14, pageHeight - 10);

    doc.save(`transitops-monthly-report-${new Date().toISOString().split("T")[0]}.pdf`);
  }

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--fg)" }}>
              <BarChart3 className="w-6 h-6 text-purple-400" />
              Financial Analytics
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
              Operational cost breakdown — all time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton data={exportMonthly} filename="analytics-monthly" />
            <button
              onClick={downloadMonthlyReport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border hover:bg-slate-800"
              style={{ color: "var(--fg)", borderColor: "var(--border)" }}
            >
              <FileText className="w-4 h-4" />
              Download Report
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {kpis.map((kpi) => (
            <motion.div key={kpi.label} variants={itemVariants}>
              <Card>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs mb-2" style={{ color: "var(--fg-muted)" }}>{kpi.label}</p>
                      <p className="text-2xl font-bold" style={{ color: "var(--fg)" }}>{kpi.value}</p>
                      <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>{kpi.sub}</p>
                    </div>
                    <div className={`${kpi.color} ${kpi.bg} p-2.5 rounded-xl`}>{kpi.icon}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Monthly Trend Chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Monthly Cost Trend (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-5 mb-3">
                {[
                  { color: "bg-amber-400", label: "Maintenance" },
                  { color: "bg-cyan-400", label: "Fuel" },
                  { color: "bg-emerald-400", label: "Expenses" },
                ].map((l) => (
                  <span key={l.label} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--fg-muted)" }}>
                    <span className={`w-2.5 h-2.5 rounded-sm ${l.color} inline-block`} />
                    {l.label}
                  </span>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px" }}
                    labelStyle={{ color: "#f1f5f9", marginBottom: "4px" }}
                    formatter={(value, name) => [`₹${Number(value).toLocaleString("en-IN")}`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
                  />
                  <Bar dataKey="maintenance" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="fuel" fill="#22d3ee" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="expenses" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Top fuel consumers */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-cyan-400" />
                  Top Fuel Consumers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topFuelVehicles.length === 0 && (
                    <p className="text-sm py-6 text-center" style={{ color: "var(--fg-muted)" }}>No fuel logs yet.</p>
                  )}
                  {topFuelVehicles.map((v, idx) => {
                    const maxCost = topFuelVehicles[0]?.cost ?? 1;
                    const pct = Math.round((v.cost / maxCost) * 100);
                    return (
                      <div key={v.name} className="flex items-center gap-3">
                        <span className="text-xs w-4 text-center font-bold" style={{ color: "var(--fg-muted)" }}>{idx + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>{v.name}</span>
                            <span className="text-sm text-cyan-400 font-semibold">{formatCurrency(v.cost)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                            <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Expenses */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Recent Trip Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentExpenses.length === 0 && (
                    <p className="text-sm py-6 text-center" style={{ color: "var(--fg-muted)" }}>No expenses recorded.</p>
                  )}
                  {recentExpenses.map((e) => (
                    <div key={e.id} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: "var(--bg)" }}>
                      <div>
                        <p className="text-sm font-medium font-mono text-blue-400">{e.trip.code}</p>
                        <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{e.trip.source} → {e.trip.destination}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-400">{formatCurrency(e.toll + e.other)}</p>
                        <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Toll: {formatCurrency(e.toll)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Fuel Logs */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-cyan-400" />
                  Recent Fuel Logs
                </span>
                <ExportButton data={recentFuelLogs.map((l) => ({
                  Vehicle: l.vehicle.name,
                  Date: formatDate(l.date),
                  "Liters": l.liters,
                  "Cost (₹)": l.cost,
                  "Rate (₹/L)": (l.cost / l.liters).toFixed(2),
                }))} filename="fuel-logs" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
                      {["Vehicle", "Date", "Liters", "Rate", "Cost"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-left" style={{ color: "var(--fg-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentFuelLogs.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-8" style={{ color: "var(--fg-muted)" }}>No fuel logs yet.</td></tr>
                    )}
                    {recentFuelLogs.map((l, i) => (
                      <tr key={l.id} className="border-b" style={{ background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}>
                        <td className="px-4 py-2.5 font-medium">{l.vehicle.name}</td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: "var(--fg-muted)" }}>{formatDate(l.date)}</td>
                        <td className="px-4 py-2.5 text-cyan-400 font-semibold">{l.liters}L</td>
                        <td className="px-4 py-2.5" style={{ color: "var(--fg-muted)" }}>₹{(l.cost / l.liters).toFixed(2)}/L</td>
                        <td className="px-4 py-2.5 font-semibold">{formatCurrency(l.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
}
