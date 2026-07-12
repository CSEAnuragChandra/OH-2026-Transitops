"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ModalForm, FormField, FormInput, FormActions } from "@/components/ui/modal-form";
import { completeTrip } from "@/app/actions/trip";

interface CompleteTripFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: {
    id: string;
    code: string;
    source: string;
    destination: string;
    vehicle?: { odometer: number; name: string } | null;
  };
}

export function CompleteTripForm({ open, onOpenChange, trip }: CompleteTripFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const finalOdometer = Number(formData.get("finalOdometer"));
    const fuelConsumed = Number(formData.get("fuelConsumed"));

    try {
      await completeTrip(trip.id, finalOdometer, fuelConsumed);
      toast.success(`Trip ${trip.code} marked as completed`);
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const currentOdometer = trip.vehicle?.odometer ?? 0;

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title={`Complete Trip ${trip.code}`}
      description={`${trip.source} → ${trip.destination}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {trip.vehicle && (
          <div className="rounded-lg p-3 text-xs" style={{ background: "var(--bg)", color: "var(--fg-muted)" }}>
            Vehicle: <strong style={{ color: "var(--fg)" }}>{trip.vehicle.name}</strong> — current odometer: <strong style={{ color: "var(--fg)" }}>{currentOdometer.toLocaleString()} km</strong>
          </div>
        )}

        <FormField label="Final Odometer Reading (km)">
          <FormInput
            name="finalOdometer"
            type="number"
            step="1"
            min={currentOdometer}
            placeholder={`Min: ${currentOdometer}`}
            required
          />
        </FormField>

        <FormField label="Fuel Consumed (Litres)">
          <FormInput
            name="fuelConsumed"
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g., 120"
            required
          />
        </FormField>

        <FormActions
          onCancel={() => onOpenChange(false)}
          loading={loading}
          submitLabel="Mark Completed"
        />
      </form>
    </ModalForm>
  );
}
