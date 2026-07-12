"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ModalForm, FormField, FormInput, FormSelect, FormActions } from "@/components/ui/modal-form";
import { createVehicle, updateVehicle } from "@/app/actions/vehicle";

interface VehicleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editVehicle?: {
    id: string;
    registrationNumber: string;
    name: string;
    type: string;
    maxLoadCapacity: number;
    acquisitionCost: number;
    odometer: number;
    status: string;
  } | null;
}

const VEHICLE_TYPES = [
  "Heavy Truck",
  "Light Truck",
  "Mini Truck",
  "Tanker",
  "Refrigerated Van",
  "Container Truck",
  "Flatbed Truck",
  "Bus",
];

export function VehicleForm({ open, onOpenChange, editVehicle }: VehicleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!editVehicle;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      if (isEdit) {
        await updateVehicle(editVehicle.id, formData);
        toast.success("Vehicle updated successfully");
      } else {
        await createVehicle(formData);
        toast.success("Vehicle registered successfully");
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
      title={isEdit ? "Edit Vehicle" : "Register New Vehicle"}
      description={isEdit ? "Update vehicle details." : "Add a new vehicle to the fleet registry."}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Registration Number">
            <FormInput
              name="registrationNumber"
              placeholder="MH-01-AB-1234"
              required
              defaultValue={editVehicle?.registrationNumber}
            />
          </FormField>
          <FormField label="Vehicle Name">
            <FormInput
              name="name"
              placeholder="e.g., Tata Prima"
              required
              defaultValue={editVehicle?.name}
            />
          </FormField>
        </div>

        <FormField label="Vehicle Type">
          <FormSelect name="type" required defaultValue={editVehicle?.type ?? ""}>
            <option value="" disabled>Select type...</option>
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </FormSelect>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Max Load Capacity (T)">
            <FormInput
              name="maxLoadCapacity"
              type="number"
              step="0.1"
              min="0.1"
              placeholder="e.g., 15"
              required
              defaultValue={editVehicle?.maxLoadCapacity}
            />
          </FormField>
          <FormField label="Acquisition Cost (₹)">
            <FormInput
              name="acquisitionCost"
              type="number"
              step="1"
              min="1"
              placeholder="e.g., 2500000"
              required
              defaultValue={editVehicle?.acquisitionCost}
            />
          </FormField>
        </div>

        <FormField label="Current Odometer (km)">
          <FormInput
            name="odometer"
            type="number"
            step="1"
            min="0"
            placeholder="e.g., 0"
            defaultValue={editVehicle?.odometer ?? 0}
          />
        </FormField>

        {isEdit && (
          <FormField label="Vehicle Status">
            <FormSelect name="status" defaultValue={editVehicle?.status}>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="ON_TRIP">ON_TRIP</option>
              <option value="IN_SHOP">IN_SHOP</option>
              <option value="RETIRED">RETIRED</option>
            </FormSelect>
          </FormField>
        )}

        <FormActions
          onCancel={() => onOpenChange(false)}
          loading={loading}
          submitLabel={isEdit ? "Update Vehicle" : "Register Vehicle"}
        />
      </form>
    </ModalForm>
  );
}
