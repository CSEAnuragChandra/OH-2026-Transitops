"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const VehicleSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required"),
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  maxLoadCapacity: z.coerce.number().positive("Must be a positive number"),
  acquisitionCost: z.coerce.number().positive("Must be a positive number"),
  odometer: z.coerce.number().min(0, "Cannot be negative"),
  status: z.enum(["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"]).optional(),
});

async function requireFleetManager() {
  const session = await auth();
  if (session?.user && "role" in session.user && session.user.role !== "FLEET_MANAGER") {
    throw new Error("Unauthorized — Fleet Manager role required");
  }
  if (!session?.user) {
    throw new Error("Unauthorized — not authenticated");
  }
  return session;
}

export async function createVehicle(formData: FormData) {
  await requireFleetManager();

  const raw = Object.fromEntries(formData.entries());
  const data = VehicleSchema.parse(raw);

  await prisma.vehicle.create({ data });
  revalidatePath("/fleet");
  return { success: true };
}

export async function updateVehicle(id: string, formData: FormData) {
  await requireFleetManager();

  const raw = Object.fromEntries(formData.entries());
  const data = VehicleSchema.parse(raw);

  await prisma.vehicle.update({ where: { id }, data });
  revalidatePath("/fleet");
  return { success: true };
}

export async function deleteVehicle(id: string) {
  await requireFleetManager();

  // Soft-delete: set status to RETIRED
  await prisma.vehicle.update({
    where: { id },
    data: { status: "RETIRED" },
  });
  revalidatePath("/fleet");
  return { success: true };
}

export async function updateVehicleStatus(
  id: string,
  status: "AVAILABLE" | "IN_SHOP" | "RETIRED" | "ON_TRIP"
) {
  await requireFleetManager();

  await prisma.vehicle.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/fleet");
  revalidatePath("/dashboard");
  return { success: true };
}
