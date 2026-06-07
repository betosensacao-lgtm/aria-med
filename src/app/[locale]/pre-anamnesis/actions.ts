"use server";

import { db } from "@/db";
import { preAnamnesis, appointments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/queries";
import { preAnamnesisSchema, type PreAnamnesisInput } from "@/lib/validations";

type SaveResult = { ok: true } | { ok: false; error: string };

export async function savePreAnamnesis(
  appointmentId: string,
  data: PreAnamnesisInput
): Promise<SaveResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const parsed = preAnamnesisSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: "Please review the form fields." };

  // Verify the appointment belongs to this patient
  const [appt] = await db
    .select({ id: appointments.id, patientId: appointments.patientId })
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!appt || appt.patientId !== user.id) {
    return { ok: false, error: "Appointment not found." };
  }

  const v = parsed.data;

  // Sanitize optional numbers (valueAsNumber yields NaN for empty inputs)
  const num = (n: number | undefined) =>
    n === undefined || Number.isNaN(n) ? null : n;

  await db
    .insert(preAnamnesis)
    .values({
      appointmentId,
      patientId: user.id,
      fullName: v.fullName,
      dateOfBirth: v.dateOfBirth,
      gender: v.gender,
      phone: v.phone,
      emergencyContact: v.emergencyContact ?? null,
      chiefComplaint: v.chiefComplaint,
      symptomsDescription: v.symptomsDescription ?? null,
      symptomsDuration: v.symptomsDuration ?? null,
      painScale: num(v.painScale),
      currentMedications: v.currentMedications,
      allergies: v.allergies,
      chronicConditions: v.chronicConditions,
      previousSurgeries: v.previousSurgeries ?? null,
      familyHistory: v.familyHistory ?? null,
      bloodType: v.bloodType ?? null,
      height: num(v.height),
      weight: num(v.weight),
      hasInsurance: v.hasInsurance,
      insuranceProvider: v.insuranceProvider ?? null,
      insurancePlanNumber: v.insurancePlanNumber ?? null,
      consentGiven: v.consentGiven,
      consentDate: new Date(),
    });

  return { ok: true };
}
