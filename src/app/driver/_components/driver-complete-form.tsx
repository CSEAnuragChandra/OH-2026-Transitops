"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle, Loader2 } from "lucide-react";
import { completeTrip } from "@/app/actions/trip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DriverCompleteTripFormProps {
  tripId: string;
  tripCode: string;
  currentOdometer: number;
  vehicleName?: string;
}

export function DriverCompleteTripForm({
  tripId,
  tripCode,
  currentOdometer,
  vehicleName,
}: DriverCompleteTripFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const finalOdometer = Number(formData.get("finalOdometer"));
    const fuelConsumed = Number(formData.get("fuelConsumed"));

    if (finalOdometer < currentOdometer) {
      toast.error("Final odometer cannot be less than the current reading");
      setLoading(false);
      return;
    }

    try {
      await completeTrip(tripId, finalOdometer, fuelConsumed);
      toast.success(`Trip ${tripCode} completed! Great work! 🎉`);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-400">
          <CheckCircle className="w-4 h-4" />
          Mark Trip as Completed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {vehicleName && (
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
              Vehicle: <strong style={{ color: "var(--fg)" }}>{vehicleName}</strong> — Current odometer: <strong style={{ color: "var(--fg)" }}>{currentOdometer.toLocaleString()} km</strong>
            </p>
          )}

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--fg-muted)" }}>
              Final Odometer Reading (km)
            </label>
            <input
              name="finalOdometer"
              type="number"
              step="1"
              min={currentOdometer}
              placeholder={`Min: ${currentOdometer}`}
              required
              className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--fg-muted)" }}>
              Fuel Consumed (Litres)
            </label>
            <input
              name="fuelConsumed"
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g., 120"
              required
              className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            id="complete-trip-btn"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Mark as Completed
              </>
            )}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
