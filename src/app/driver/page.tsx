// src/app/driver/page.tsx
// Driver portal — full-featured dashboard for logged-in drivers
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Truck,
  Route,
  LogOut,
  Gauge,
  ShieldCheck,
  Phone,
  CreditCard,
  AlertTriangle,
  Clock,
  Navigation,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { DriverCompleteTripForm } from "./_components/driver-complete-form";
import { TripHistory } from "./_components/trip-history";
import { ChangePasswordButton } from "./_components/change-password-button";
import { differenceInDays, addHours, format } from "date-fns";

export const metadata: Metadata = { title: "My Dashboard | TransitOps Driver Portal" };

function getLicenseExpiryInfo(expiry: Date): { label: string; variant: "success" | "warning" | "danger" } {
  const days = differenceInDays(expiry, new Date());
  if (days < 0) return { label: "EXPIRED", variant: "danger" };
  if (days < 30) return { label: `${days}d left`, variant: "danger" };
  if (days < 90) return { label: `${days}d left`, variant: "warning" };
  return { label: `${days}d left`, variant: "success" };
}

function estimateETA(dispatchedAt: Date, distanceKm: number): string {
  // Assume avg speed 60 km/h
  const hoursNeeded = distanceKm / 60;
  const eta = addHours(dispatchedAt, hoursNeeded);
  return format(eta, "dd MMM yyyy, hh:mm a");
}

export default async function DriverPortalPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as { role: Role }).role;
  if (role !== "DRIVER") redirect("/dashboard");

  const driverProfile = await prisma.driver.findFirst({
    where: { user: { email: session.user.email! } },
    include: {
      trips: {
        include: { vehicle: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const activeTrip = driverProfile?.trips?.find((t) => t.status === "DISPATCHED") ?? null;
  const completedTrips = driverProfile?.trips?.filter((t) => t.status === "COMPLETED") ?? [];

  const licenseInfo = driverProfile
    ? getLicenseExpiryInfo(driverProfile.licenseExpiry)
    : null;

  const safetyScore = driverProfile?.safetyScore ?? 0;
  const safetyColor =
    safetyScore >= 90 ? "var(--success)" : safetyScore >= 70 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Topbar */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-5 py-3.5 border-b"
        style={{ background: "var(--bg-sidebar)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
            <Gauge className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">TransitOps</span>
            <span className="text-xs text-slate-500 ml-1.5">Driver Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ChangePasswordButton />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors hover:border-red-500/50 hover:text-red-400"
              style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 py-6 space-y-5">

        {/* ── Profile Card ── */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-lg">
                {(driverProfile?.name ?? session.user.name ?? "D").charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-lg leading-tight" style={{ color: "var(--fg)" }}>
                      {driverProfile?.name ?? session.user.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
                      {session.user.email}
                    </p>
                  </div>
                  {driverProfile && (
                    <Badge variant={
                      driverProfile.status === "AVAILABLE" ? "success" :
                      driverProfile.status === "ON_TRIP" ? "info" :
                      driverProfile.status === "OFF_DUTY" ? "warning" : "danger"
                    }>
                      {driverProfile.status.replace("_", " ")}
                    </Badge>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap gap-4 mt-3">
                  {driverProfile?.contactNumber && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fg-muted)" }} />
                      <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                        {driverProfile.contactNumber}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: safetyColor }} />
                    <span className="text-xs font-bold" style={{ color: safetyColor }}>
                      Safety: {safetyScore}/100
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Route className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fg-muted)" }} />
                    <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                      {completedTrips.length} trip{completedTrips.length !== 1 ? "s" : ""} completed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── License Card ── */}
        {driverProfile && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-400" />
                License Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs" style={{ color: "var(--fg-muted)" }}>License Number</p>
                  <p className="font-mono text-sm font-semibold" style={{ color: "var(--fg)" }}>
                    {driverProfile.licenseNumber}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Category</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                    {driverProfile.licenseCategory}
                  </p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Expiry Date</p>
                  <div className="flex items-center gap-2.5">
                    {licenseInfo && licenseInfo.variant !== "success" && (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                      {format(driverProfile.licenseExpiry, "dd MMM yyyy")}
                    </span>
                    {licenseInfo && (
                      <Badge variant={licenseInfo.variant}>{licenseInfo.label}</Badge>
                    )}
                  </div>
                  {licenseInfo && licenseInfo.variant === "danger" && (
                    <p className="text-xs mt-1 text-red-400">
                      ⚠ Contact your Fleet Manager to renew your license.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Active Trip ── */}
        {activeTrip ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-400 animate-pulse" />
                  Active Trip — {activeTrip.code}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Route */}
                <div className="relative pl-6 space-y-4">
                  {/* Vertical line */}
                  <div
                    className="absolute left-2 top-2 bottom-2 w-0.5 rounded-full"
                    style={{ background: "var(--border)" }}
                  />
                  <div className="flex items-center gap-3">
                    <div className="absolute left-0 w-4 h-4 rounded-full border-2 border-emerald-400 bg-emerald-400/20" />
                    <div>
                      <p className="text-xs" style={{ color: "var(--fg-muted)" }}>From</p>
                      <p className="font-semibold" style={{ color: "var(--fg)" }}>{activeTrip.source}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="absolute left-0 w-4 h-4 rounded-full border-2 border-red-400 bg-red-400/20" />
                    <div>
                      <p className="text-xs" style={{ color: "var(--fg-muted)" }}>To</p>
                      <p className="font-semibold" style={{ color: "var(--fg)" }}>{activeTrip.destination}</p>
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg)" }}>
                    <p className="text-xs mb-1" style={{ color: "var(--fg-muted)" }}>Cargo</p>
                    <p className="font-bold text-sm" style={{ color: "var(--fg)" }}>
                      {activeTrip.cargoWeight} T
                    </p>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg)" }}>
                    <p className="text-xs mb-1" style={{ color: "var(--fg-muted)" }}>Distance</p>
                    <p className="font-bold text-sm" style={{ color: "var(--fg)" }}>
                      {activeTrip.plannedDistance} km
                    </p>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg)" }}>
                    <p className="text-xs mb-1" style={{ color: "var(--fg-muted)" }}>Status</p>
                    <Badge variant="info" className="text-xs">ACTIVE</Badge>
                  </div>
                </div>

                {/* ETA */}
                <div
                  className="flex items-center gap-3 rounded-xl p-4"
                  style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}
                >
                  <Clock className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--fg-muted)" }}>
                      Estimated Arrival (at 60 km/h avg)
                    </p>
                    <p className="text-sm font-bold" style={{ color: "var(--fg)" }}>
                      {estimateETA(activeTrip.updatedAt, activeTrip.plannedDistance)}
                    </p>
                  </div>
                </div>

                {/* Vehicle */}
                {activeTrip.vehicle && (
                  <div className="flex items-center gap-3 pt-1">
                    <Truck className="w-4 h-4 shrink-0" style={{ color: "var(--fg-muted)" }} />
                    <div>
                      <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Assigned Vehicle</p>
                      <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>
                        {activeTrip.vehicle.name}
                        <span className="ml-1.5 font-mono text-xs" style={{ color: "var(--fg-muted)" }}>
                          {activeTrip.vehicle.registrationNumber}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Complete trip form */}
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
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: "var(--bg)" }}
              >
                <Truck className="w-8 h-8" style={{ color: "var(--fg-muted)" }} />
              </div>
              <p className="font-semibold" style={{ color: "var(--fg)" }}>No Active Trip</p>
              <p className="text-sm mt-1 max-w-xs mx-auto" style={{ color: "var(--fg-muted)" }}>
                You have no dispatched trips right now. Your dispatcher will assign one soon.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Trip History ── */}
        <TripHistory trips={completedTrips} />

        {/* Bottom spacing */}
        <div className="h-4" />
      </main>
    </div>
  );
}
