"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { ModalForm, FormField, FormSelect, FormActions } from "@/components/ui/modal-form";
import { dispatchTrip } from "@/app/actions/trip";

interface DispatchFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: {
    id: string;
    code: string;
    source: string;
    destination: string;
    cargoWeight: number;
  };
  availableVehicles: {
    id: string;
    name: string;
    registrationNumber: string;
    maxLoadCapacity: number;
  }[];
  availableDrivers: {
    id: string;
    name: string;
    licenseCategory: string;
  }[];
}

export function DispatchForm({
  open,
  onOpenChange,
  trip,
  availableVehicles,
  availableDrivers,
}: DispatchFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");

  const chosenVehicle = availableVehicles.find((v) => v.id === selectedVehicle);
  const capacityExceeded = chosenVehicle
    ? trip.cargoWeight > chosenVehicle.maxLoadCapacity
    : false;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const vehicleId = formData.get("vehicleId") as string;
    const driverId = formData.get("driverId") as string;

    try {
      await dispatchTrip(trip.id, vehicleId, driverId);
      toast.success(`Trip ${trip.code} dispatched successfully`);
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message || "Dispatch failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title={`Dispatch Trip ${trip.code}`}
      description={`${trip.source} → ${trip.destination} · ${trip.cargoWeight}T cargo`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Assign Vehicle">
          <FormSelect
            name="vehicleId"
            required
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
          >
            <option value="" disabled>Select available vehicle...</option>
            {availableVehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.registrationNumber}) — {v.maxLoadCapacity}T capacity
              </option>
            ))}
          </FormSelect>
        </FormField>

        {/* Capacity check warning */}
        {chosenVehicle && (
          <div
            className={`rounded-lg p-3 text-xs flex items-start gap-2 ${
              capacityExceeded
                ? "bg-red-500/10 text-red-400 border border-red-500/30"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
            }`}
          >
            {capacityExceeded ? (
              <>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Cargo ({trip.cargoWeight}T) exceeds vehicle capacity ({chosenVehicle.maxLoadCapacity}T). Please select a different vehicle.
                </span>
              </>
            ) : (
              <span>
                ✓ Cargo ({trip.cargoWeight}T) fits within vehicle capacity ({chosenVehicle.maxLoadCapacity}T)
              </span>
            )}
          </div>
        )}

        <FormField label="Assign Driver">
          <FormSelect name="driverId" required>
            <option value="" disabled>Select available driver...</option>
            {availableDrivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.licenseCategory}
              </option>
            ))}
          </FormSelect>
        </FormField>

        {availableVehicles.length === 0 && (
          <p className="text-xs text-amber-400">⚠ No vehicles are available right now.</p>
        )}
        {availableDrivers.length === 0 && (
          <p className="text-xs text-amber-400">⚠ No drivers are available right now.</p>
        )}

        <FormActions
          onCancel={() => onOpenChange(false)}
          loading={loading}
          submitLabel="Dispatch Trip"
        />
      </form>
    </ModalForm>
  );
}
