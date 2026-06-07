"use server";

import { db } from "@/db";
import { appointments, professionals } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { getCurrentUser } from "@/lib/queries";
import { addMinutesToTime, getAvailableSlots } from "@/lib/booking";
import { sendBookingNotifications } from "@/lib/email/notifications";

export async function getSlotsForProfessional(professionalId: string, date: string) {
  const [pro] = await db
    .select()
    .from(professionals)
    .where(eq(professionals.id, professionalId))
    .limit(1);

  if (!pro) return [];
  return getAvailableSlots(pro, date);
}

type BookResult =
  | { ok: true; appointmentId: string }
  | { ok: false; error: string; needsAuth?: boolean };

export async function createAppointment(input: {
  clinicId: string;
  professionalId: string;
  date: string;      // "yyyy-MM-dd"
  startTime: string; // "HH:MM"
  triageSessionId?: string;
}): Promise<BookResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to book.", needsAuth: true };
  }

  // Load professional to compute end time and validate it exists
  const [pro] = await db
    .select()
    .from(professionals)
    .where(eq(professionals.id, input.professionalId))
    .limit(1);

  if (!pro) {
    return { ok: false, error: "Professional not found." };
  }

  const endTime = addMinutesToTime(input.startTime, pro.slotDuration);

  // Guard against double-booking: re-check the slot is still free.
  const conflict = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.professionalId, input.professionalId),
        eq(appointments.date, input.date),
        eq(appointments.startTime, input.startTime),
        ne(appointments.status, "cancelled")
      )
    )
    .limit(1);

  if (conflict.length > 0) {
    return { ok: false, error: "Sorry, that time was just taken. Please pick another slot." };
  }

  const [created] = await db
    .insert(appointments)
    .values({
      patientId: user.id,
      clinicId: input.clinicId,
      professionalId: input.professionalId,
      date: input.date,
      startTime: input.startTime,
      endTime,
      status: "pending",
      ...(input.triageSessionId ? { triageSessionId: input.triageSessionId } : {}),
    })
    .returning({ id: appointments.id });

  // Fire confirmation + clinic notification emails. Best-effort: we await so
  // errors are logged, but sendBookingNotifications never throws, so a failed
  // email can't break the booking.
  await sendBookingNotifications(created.id);

  return { ok: true, appointmentId: created.id };
}
