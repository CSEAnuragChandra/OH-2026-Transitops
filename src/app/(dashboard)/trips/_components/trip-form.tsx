"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ModalForm, FormField, FormInput, FormActions } from "@/components/ui/modal-form";
import { createTrip, updateTrip } from "@/app/actions/trip";

interface TripFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextCode: string;
  editTrip?: {
    id: string;
    code: string;
    source: string;
    destination: string;
    cargoWeight: number;
    plannedDistance: number;
  } | null;
}

export function TripForm({ open, onOpenChange, nextCode, editTrip }: TripFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      if (editTrip) {
        await updateTrip(editTrip.id, formData);
        toast.success("Trip updated successfully");
      } else {
        await createTrip(formData);
        toast.success("Trip created as DRAFT");
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title={editTrip ? "Edit Trip" : "Create New Trip"}
      description={editTrip ? "Update trip details." : "Trips start as DRAFT. Assign a vehicle and driver to dispatch."}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Trip Code">
          <FormInput
            name="code"
            placeholder="e.g., TR004"
            required
            defaultValue={editTrip?.code ?? nextCode}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Source">
            <FormInput name="source" placeholder="e.g., Mumbai" required defaultValue={editTrip?.source} />
          </FormField>
          <FormField label="Destination">
            <FormInput name="destination" placeholder="e.g., Delhi" required defaultValue={editTrip?.destination} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Cargo Weight (T)">
            <FormInput
              name="cargoWeight"
              type="number"
              step="0.1"
              min="0.1"
              placeholder="e.g., 10"
              required
              defaultValue={editTrip?.cargoWeight}
            />
          </FormField>
          <FormField label="Planned Distance (km)">
            <FormInput
              name="plannedDistance"
              type="number"
              step="1"
              min="1"
              placeholder="e.g., 1400"
              required
              defaultValue={editTrip?.plannedDistance}
            />
          </FormField>
        </div>

        <FormActions onCancel={() => onOpenChange(false)} loading={loading} submitLabel={editTrip ? "Update Trip" : "Create Trip"} />
      </form>
    </ModalForm>
  );
}
