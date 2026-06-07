"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  await db
    .update(appointments)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(appointments.id, appointmentId));

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
}
