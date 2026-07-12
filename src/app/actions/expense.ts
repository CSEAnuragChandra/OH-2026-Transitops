"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function createExpense(formData: FormData) {
  await requireAuth();

  const tripId = formData.get("tripId") as string;
  const toll = Number(formData.get("toll") || 0);
  const other = Number(formData.get("other") || 0);

  if (!tripId) throw new Error("Trip ID is required");

  await prisma.expense.create({
    data: {
      tripId,
      toll,
      other,
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/trips");
  return { success: true };
}
