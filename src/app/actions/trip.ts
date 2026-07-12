"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const TripSchema = z.object({
  code: z.string().min(1, "Trip code is required"),
  source: z.string().min(1, "Source is required"),
  destination: z.string().min(1, "Destination is required"),
  cargoWeight: z.coerce.number().positive("Cargo weight must be positive"),
  plannedDistance: z.coerce.number().positive("Distance must be positive"),
});

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

async function requireDispatcherOrManager() {
  const session = await requireAuth();
  const role = (session.user as { role: string }).role;
  if (!["DISPATCHER", "FLEET_MANAGER"].includes(role)) {
    throw new Error("Unauthorized — Dispatcher or Fleet Manager required");
  }
  return session;
}

export async function createTrip(formData: FormData) {
  await requireDispatcherOrManager();

  const raw = Object.fromEntries(formData.entries());
  const data = TripSchema.parse(raw);

  await prisma.trip.create({ data });
  revalidatePath("/trips");
  return { success: true };
}

export async function dispatchTrip(
  tripId: string,
  vehicleId: string,
  driverId: string
) {
  await requireDispatcherOrManager();

  // Validate cargo weight vs vehicle capacity
  const [trip, vehicle] = await Promise.all([
    prisma.trip.findUnique({ where: { id: tripId } }),
    prisma.vehicle.findUnique({ where: { id: vehicleId } }),
  ]);

  if (!trip || !vehicle) throw new Error("Trip or vehicle not found");
  if (vehicle.status !== "AVAILABLE") {
    throw new Error(`Vehicle is not available (current status: ${vehicle.status})`);
  }

  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) throw new Error("Driver not found");
  if (driver.status !== "AVAILABLE") {
    throw new Error(`Driver is not available (current status: ${driver.status})`);
  }

  if (trip.cargoWeight > vehicle.maxLoadCapacity) {
    throw new Error(
      `Cargo (${trip.cargoWeight}T) exceeds vehicle capacity (${vehicle.maxLoadCapacity}T)`
    );
  }

  // Atomic: update Trip + Vehicle + Driver together
  await prisma.$transaction([
    prisma.trip.update({
      where: { id: tripId },
      data: { status: "DISPATCHED", vehicleId, driverId },
    }),
    prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: "ON_TRIP" },
    }),
    prisma.driver.update({
      where: { id: driverId },
      data: { status: "ON_TRIP" },
    }),
  ]);

  revalidatePath("/trips");
  revalidatePath("/fleet");
  revalidatePath("/drivers");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function completeTrip(
  tripId: string,
  finalOdometer: number,
  fuelConsumed: number
) {
  await requireAuth();

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { vehicle: true, driver: true },
  });

  if (!trip) throw new Error("Trip not found");
  if (trip.status !== "DISPATCHED") throw new Error("Trip is not dispatched");

  await prisma.$transaction([
    prisma.trip.update({
      where: { id: tripId },
      data: { status: "COMPLETED", finalOdometer, fuelConsumed },
    }),
    ...(trip.vehicleId
      ? [
          prisma.vehicle.update({
            where: { id: trip.vehicleId },
            data: { status: "AVAILABLE", odometer: finalOdometer },
          }),
        ]
      : []),
    ...(trip.driverId
      ? [
          prisma.driver.update({
            where: { id: trip.driverId },
            data: { status: "AVAILABLE" },
          }),
        ]
      : []),
  ]);

  revalidatePath("/trips");
  revalidatePath("/fleet");
  revalidatePath("/drivers");
  revalidatePath("/driver");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function cancelTrip(tripId: string) {
  await requireDispatcherOrManager();

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) throw new Error("Trip not found");

  await prisma.$transaction([
    prisma.trip.update({
      where: { id: tripId },
      data: { status: "CANCELLED" },
    }),
    ...(trip.vehicleId
      ? [
          prisma.vehicle.update({
            where: { id: trip.vehicleId },
            data: { status: "AVAILABLE" },
          }),
        ]
      : []),
    ...(trip.driverId
      ? [
          prisma.driver.update({
            where: { id: trip.driverId },
            data: { status: "AVAILABLE" },
          }),
        ]
      : []),
  ]);

  revalidatePath("/trips");
  revalidatePath("/fleet");
  revalidatePath("/drivers");
  revalidatePath("/dashboard");
  return { success: true };
}
