"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function createMaintenanceLog(formData: FormData) {
  await requireAuth();

  const vehicleId = formData.get("vehicleId") as string;
  const description = formData.get("description") as string;
  const cost = Number(formData.get("cost"));
  const date = new Date(formData.get("date") as string);

  if (!vehicleId || !description || isNaN(cost) || isNaN(date.getTime())) {
    throw new Error("Invalid form data");
  }

  await prisma.$transaction([
    prisma.maintenanceLog.create({
      data: {
        vehicleId,
        description,
        cost,
        date,
        status: "In Shop",
      },
    }),
    // Automatically mark vehicle as IN_SHOP
    prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: "IN_SHOP" },
    }),
  ]);

  revalidatePath("/maintenance");
  revalidatePath("/fleet");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function completeMaintenanceLog(logId: string, vehicleId: string) {
  await requireAuth();

  await prisma.$transaction([
    prisma.maintenanceLog.update({
      where: { id: logId },
      data: { status: "Completed" },
    }),
    // Set vehicle back to AVAILABLE
    prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: "AVAILABLE" },
    }),
  ]);

  revalidatePath("/maintenance");
  revalidatePath("/fleet");
  return { success: true };
}
