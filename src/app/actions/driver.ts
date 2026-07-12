"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

const DriverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseCategory: z.string().min(1, "License category is required"),
  licenseExpiry: z.string().min(1, "License expiry is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
});

async function requireFleetManager() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized — not authenticated");
  if ((session.user as { role: string }).role !== "FLEET_MANAGER") {
    throw new Error("Unauthorized — Fleet Manager role required");
  }
  return session;
}

export async function createDriver(formData: FormData) {
  await requireFleetManager();

  const raw = Object.fromEntries(formData.entries());
  const data = DriverSchema.parse(raw);

  // Auto-generate driver email and temporary password
  const emailBase = data.name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z.]/g, "");
  const email = `${emailBase}.driver@transitops.com`;
  const temporaryPassword = "driver123";
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  // Atomic transaction: create User + Driver together
  await prisma.$transaction(async (tx) => {
    // Check if email already exists, append number if needed
    const existing = await tx.user.findUnique({ where: { email } });
    const finalEmail = existing
      ? `${emailBase}${Date.now()}.driver@transitops.com`
      : email;

    const user = await tx.user.create({
      data: {
        email: finalEmail,
        password: hashedPassword,
        name: data.name,
        role: "DRIVER",
      },
    });

    await tx.driver.create({
      data: {
        name: data.name,
        licenseNumber: data.licenseNumber,
        licenseCategory: data.licenseCategory,
        licenseExpiry: new Date(data.licenseExpiry),
        contactNumber: data.contactNumber,
        userId: user.id,
      },
    });

    return { email: finalEmail };
  });

  revalidatePath("/drivers");
  return { success: true, email, temporaryPassword };
}

export async function updateDriver(id: string, formData: FormData) {
  await requireFleetManager();

  const raw = Object.fromEntries(formData.entries());
  const data = DriverSchema.parse(raw);

  await prisma.driver.update({
    where: { id },
    data: {
      name: data.name,
      licenseNumber: data.licenseNumber,
      licenseCategory: data.licenseCategory,
      licenseExpiry: new Date(data.licenseExpiry),
      contactNumber: data.contactNumber,
    },
  });

  revalidatePath("/drivers");
  return { success: true };
}

export async function deleteDriver(id: string) {
  await requireFleetManager();

  await prisma.driver.update({
    where: { id },
    data: { status: "SUSPENDED" },
  });

  revalidatePath("/drivers");
  return { success: true };
}
