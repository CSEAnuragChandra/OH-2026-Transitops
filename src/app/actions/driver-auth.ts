"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

export async function changeDriverPassword(
  currentPassword: string,
  newPassword: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized — not authenticated");

  const role = (session.user as { role: Role }).role;
  if (role !== "DRIVER") throw new Error("Only drivers can use this action");

  if (newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });
  if (!user) throw new Error("User not found");

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) throw new Error("Current password is incorrect");

  const hashedNew = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedNew },
  });

  return { success: true };
}
