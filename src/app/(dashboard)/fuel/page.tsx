// src/app/(dashboard)/fuel/page.tsx
import { Metadata } from "next";
import { Fuel } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Fuel Logs" };

export default function FuelPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--fg)" }}>
          <Fuel className="w-6 h-6 text-cyan-400" />
          Fuel Logs
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
          Monitor fuel consumption and costs per vehicle and trip
        </p>
      </div>
      <Card>
        <CardContent className="text-center py-16">
          <Fuel className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="font-semibold text-lg" style={{ color: "var(--fg)" }}>Coming Soon</p>
          <p className="text-sm mt-2" style={{ color: "var(--fg-muted)" }}>
            Fuel log management — assigned to team member 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
