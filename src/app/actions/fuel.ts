"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function createFuelLog(formData: FormData) {
  await requireAuth();

  const vehicleId = formData.get("vehicleId") as string;
  const tripId = (formData.get("tripId") as string) || null;
  const liters = Number(formData.get("liters"));
  const cost = Number(formData.get("cost"));
  const date = new Date(formData.get("date") as string);

  if (!vehicleId || isNaN(liters) || isNaN(cost) || isNaN(date.getTime())) {
    throw new Error("Invalid form data");
  }

  await prisma.fuelLog.create({
    data: {
      vehicleId,
      tripId: tripId || null,
      liters,
      cost,
      date,
    },
  });

  revalidatePath("/fuel");
  revalidatePath("/dashboard");
  return { success: true };
}
