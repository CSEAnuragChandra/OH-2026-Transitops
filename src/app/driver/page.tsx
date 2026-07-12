// src/app/driver/page.tsx
// Driver portal — shows active trip with Mark as Completed form
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Route, MapPin, LogOut, Gauge, ShieldCheck } from "lucide-react";
import type { Role } from "@prisma/client";
import { DriverCompleteTripForm } from "./_components/driver-complete-form";

export const metadata: Metadata = { title: "My Trip | TransitOps" };

export default async function DriverPortalPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as { role: Role }).role;
  if (role !== "DRIVER") redirect("/dashboard");

  const driverProfile = await prisma.driver.findFirst({
    where: { user: { email: session.user.email! } },
    include: {
      trips: {
        where: { status: "DISPATCHED" },
        include: { vehicle: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const activeTrip = driverProfile?.trips?.[0];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Topbar */}
      <header
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ background: "var(--bg-sidebar)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-blue-400" />
          <span className="font-bold text-white text-sm">TransitOps</span>
          <span className="text-xs text-slate-500 ml-1">Driver Portal</span>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </form>
      </header>

      <main className="flex-1 p-5 max-w-lg mx-auto w-full space-y-5">
        {/* Driver Profile Card */}
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center text-white text-lg font-bold shrink-0">
              {(driverProfile?.name ?? session.user.name ?? "D").charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ color: "var(--fg)" }}>
                {driverProfile?.name ?? session.user.name}
              </p>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                License: {driverProfile?.licenseNumber ?? "N/A"} · {driverProfile?.licenseCategory ?? ""}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-bold" style={{
                  color: (driverProfile?.safetyScore ?? 0) >= 90 ? "var(--success)" : (driverProfile?.safetyScore ?? 0) >= 70 ? "var(--warning)" : "var(--danger)"
                }}>
                  Safety Score: {driverProfile?.safetyScore ?? "—"}/100
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Trip */}
        {activeTrip ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="w-4 h-4 text-blue-400" />
                  Active Trip — {activeTrip.code}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs" style={{ color: "var(--fg-muted)" }}>From</p>
                    <p className="font-medium" style={{ color: "var(--fg)" }}>{activeTrip.source}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                  <div>
                    <p className="text-xs" style={{ color: "var(--fg-muted)" }}>To</p>
                    <p className="font-medium" style={{ color: "var(--fg)" }}>{activeTrip.destination}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-lg p-3" style={{ background: "var(--bg)" }}>
                    <p className="text-xs mb-1" style={{ color: "var(--fg-muted)" }}>Cargo</p>
                    <p className="font-bold" style={{ color: "var(--fg)" }}>{activeTrip.cargoWeight} T</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: "var(--bg)" }}>
                    <p className="text-xs mb-1" style={{ color: "var(--fg-muted)" }}>Distance</p>
                    <p className="font-bold" style={{ color: "var(--fg)" }}>{activeTrip.plannedDistance} km</p>
                  </div>
                </div>
                {activeTrip.vehicle && (
                  <div className="flex items-center gap-2 pt-1">
                    <Truck className="w-4 h-4 text-slate-400" />
                    <span className="text-sm" style={{ color: "var(--fg-muted)" }}>
                      {activeTrip.vehicle.name} · {activeTrip.vehicle.registrationNumber}
                    </span>
                  </div>
                )}
                <Badge variant="info" className="text-xs">DISPATCHED</Badge>
              </CardContent>
            </Card>

            {/* Mark as Completed — Client Component */}
            <DriverCompleteTripForm
              tripId={activeTrip.id}
              tripCode={activeTrip.code}
              currentOdometer={activeTrip.vehicle?.odometer ?? 0}
              vehicleName={activeTrip.vehicle?.name}
            />
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-10">
              <Truck className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p className="font-medium" style={{ color: "var(--fg)" }}>No Active Trip</p>
              <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>
                You have no dispatched trips right now. Check back later.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
