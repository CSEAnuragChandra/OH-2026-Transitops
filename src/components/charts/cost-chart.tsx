"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CostChartProps {
  data: { month: string; maintenance: number; fuel: number }[];
}

export function CostChart({ data }: CostChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="month"
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "#f1f5f9", marginBottom: "4px" }}
          formatter={(value, name) => [
            `₹${Number(value).toLocaleString("en-IN")}`,
            name === "maintenance" ? "Maintenance" : "Fuel",
          ]}
        />
        <Bar
          dataKey="maintenance"
          fill="#f59e0b"
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
        <Bar
          dataKey="fuel"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
