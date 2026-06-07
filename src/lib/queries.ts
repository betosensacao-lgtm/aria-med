import { db } from "@/db";
import { appointments, clinics, professionals, users, preAnamnesis, triageSessions } from "@/db/schema";
import { eq, and, desc, asc, count, gte, lte, inArray, ilike, isNotNull } from "drizzle-orm";
import { createServerSupabaseClient } from "@/lib/supabase";
import { format, startOfMonth, endOfMonth } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppointmentRow = typeof appointments.$inferSelect & {
  patient: { id: string; name: string; email: string } | null;
  professional: { id: string; name: string; specialty: string } | null;
  hasPreAnamnesis: boolean;
};

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.supabaseId, authUser.id))
    .limit(1);

  return result[0] ?? null;
}

export async function getClinicByOwner(ownerId: string) {
  const result = await db
    .select()
    .from(clinics)
    .where(eq(clinics.ownerId, ownerId))
    .limit(1);

  return result[0] ?? null;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardStats(clinicId: string) {
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const [[todayResult], [pendingResult], [completedResult], uniquePatients] =
    await Promise.all([
      db.select({ count: count() }).from(appointments).where(
        and(eq(appointments.clinicId, clinicId), eq(appointments.date, today))
      ),
      db.select({ count: count() }).from(appointments).where(
        and(eq(appointments.clinicId, clinicId), eq(appointments.status, "pending"))
      ),
      db.select({ count: count() }).from(appointments).where(
        and(
          eq(appointments.clinicId, clinicId),
          eq(appointments.status, "completed"),
          gte(appointments.date, monthStart),
          lte(appointments.date, monthEnd)
        )
      ),
      db.selectDistinct({ patientId: appointments.patientId }).from(appointments).where(
        eq(appointments.clinicId, clinicId)
      ),
    ]);

  return {
    todayAppointments: todayResult?.count ?? 0,
    pendingConfirmations: pendingResult?.count ?? 0,
    completedThisMonth: completedResult?.count ?? 0,
    totalPatients: uniquePatients.length,
  };
}

// ─── Appointments ─────────────────────────────────────────────────────────────

async function attachPreAnamnesis(
  rows: { appointment: typeof appointments.$inferSelect; patient: any; professional: any }[]
): Promise<AppointmentRow[]> {
  if (rows.length === 0) return [];

  const ids = rows.map(r => r.appointment.id);
  const found = await db
    .select({ appointmentId: preAnamnesis.appointmentId })
    .from(preAnamnesis)
    .where(inArray(preAnamnesis.appointmentId, ids));

  const set = new Set(found.map(r => r.appointmentId));

  return rows.map(r => ({
    ...r.appointment,
    patient: r.patient,
    professional: r.professional,
    hasPreAnamnesis: set.has(r.appointment.id),
  }));
}

export async function getTodayAppointments(clinicId: string): Promise<AppointmentRow[]> {
  const today = format(new Date(), "yyyy-MM-dd");

  const rows = await db
    .select({
      appointment: appointments,
      patient: { id: users.id, name: users.name, email: users.email },
      professional: { id: professionals.id, name: professionals.name, specialty: professionals.specialty },
    })
    .from(appointments)
    .leftJoin(users, eq(appointments.patientId, users.id))
    .leftJoin(professionals, eq(appointments.professionalId, professionals.id))
    .where(and(eq(appointments.clinicId, clinicId), eq(appointments.date, today)))
    .orderBy(asc(appointments.startTime));

  return attachPreAnamnesis(rows);
}

export async function getAppointments(
  clinicId: string,
  filters: { status?: string; date?: string } = {}
): Promise<AppointmentRow[]> {
  const conditions = [eq(appointments.clinicId, clinicId)];

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(appointments.status, filters.status as any));
  }
  if (filters.date) {
    conditions.push(eq(appointments.date, filters.date));
  }

  const rows = await db
    .select({
      appointment: appointments,
      patient: { id: users.id, name: users.name, email: users.email },
      professional: { id: professionals.id, name: professionals.name, specialty: professionals.specialty },
    })
    .from(appointments)
    .leftJoin(users, eq(appointments.patientId, users.id))
    .leftJoin(professionals, eq(appointments.professionalId, professionals.id))
    .where(and(...conditions))
    .orderBy(desc(appointments.date), asc(appointments.startTime))
    .limit(100);

  return rows.map(r => ({
    ...r.appointment,
    patient: r.patient,
    professional: r.professional,
    hasPreAnamnesis: false,
  }));
}

// ─── Patient's own appointments ───────────────────────────────────────────────

export type PatientAppointmentRow = typeof appointments.$inferSelect & {
  clinic: { id: string; name: string; slug: string } | null;
  professional: { id: string; name: string; specialty: string } | null;
  hasPreAnamnesis: boolean;
};

export async function getPatientAppointments(
  patientId: string,
  filters: { status?: string } = {}
): Promise<PatientAppointmentRow[]> {
  const conditions = [eq(appointments.patientId, patientId)];
  if (filters.status && filters.status !== "all") {
    conditions.push(eq(appointments.status, filters.status as any));
  }

  const rows = await db
    .select({
      appointment: appointments,
      clinic: { id: clinics.id, name: clinics.name, slug: clinics.slug },
      professional: { id: professionals.id, name: professionals.name, specialty: professionals.specialty },
    })
    .from(appointments)
    .leftJoin(clinics, eq(appointments.clinicId, clinics.id))
    .leftJoin(professionals, eq(appointments.professionalId, professionals.id))
    .where(and(...conditions))
    .orderBy(desc(appointments.date), asc(appointments.startTime))
    .limit(100);

  if (rows.length === 0) return [];

  // Mark which appointments already have a pre-anamnesis submitted
  const ids = rows.map(r => r.appointment.id);
  const withPre = await db
    .select({ appointmentId: preAnamnesis.appointmentId })
    .from(preAnamnesis)
    .where(inArray(preAnamnesis.appointmentId, ids));
  const preSet = new Set(withPre.map(r => r.appointmentId));

  return rows.map(r => ({
    ...r.appointment,
    clinic: r.clinic,
    professional: r.professional,
    hasPreAnamnesis: preSet.has(r.appointment.id),
  }));
}

// ─── Patients ─────────────────────────────────────────────────────────────────

export type PatientRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  appointmentCount: number;
  lastAppointment: string | null;
};

export async function getPatients(
  clinicId: string,
  query?: string
): Promise<PatientRow[]> {
  const where = query
    ? and(eq(appointments.clinicId, clinicId), ilike(users.name, `%${query}%`))
    : eq(appointments.clinicId, clinicId);

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      createdAt: users.createdAt,
      appointmentCount: count(appointments.id),
      lastAppointment: desc(appointments.date),
    })
    .from(appointments)
    .innerJoin(users, eq(appointments.patientId, users.id))
    .where(where)
    .groupBy(users.id, users.name, users.email, users.phone, users.createdAt)
    .orderBy(asc(users.name))
    .limit(100);

  return rows.map(r => ({
    ...r,
    lastAppointment: null, // simplified — see note below
  }));
}

// Separate query for last appointment date per patient (grouped max)
export async function getPatientsWithLastDate(
  clinicId: string,
  query?: string
): Promise<PatientRow[]> {
  const where = query
    ? and(eq(appointments.clinicId, clinicId), ilike(users.name, `%${query}%`))
    : eq(appointments.clinicId, clinicId);

  // Drizzle does not expose sql`max(...)` typed, so we use the raw count approach
  // and fetch the last appointment in a second query per patient.
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      createdAt: users.createdAt,
      appointmentCount: count(appointments.id),
    })
    .from(appointments)
    .innerJoin(users, eq(appointments.patientId, users.id))
    .where(where)
    .groupBy(users.id, users.name, users.email, users.phone, users.createdAt)
    .orderBy(asc(users.name))
    .limit(100);

  if (rows.length === 0) return [];

  // Fetch most recent appointment per patient in one query
  const patientIds = rows.map(r => r.id);
  const recentAppts = await db
    .selectDistinctOn([appointments.patientId], {
      patientId: appointments.patientId,
      date: appointments.date,
    })
    .from(appointments)
    .where(and(eq(appointments.clinicId, clinicId), inArray(appointments.patientId, patientIds)))
    .orderBy(appointments.patientId, desc(appointments.date));

  const lastDateMap = new Map(recentAppts.map(r => [r.patientId, r.date]));

  return rows.map(r => ({
    ...r,
    lastAppointment: lastDateMap.get(r.id) ?? null,
  }));
}

// ─── Triages ──────────────────────────────────────────────────────────────────

export async function getTriagesByClinic(clinicId: string) {
  // Sessions linked to this clinic's appointments
  const linked = await db
    .select({
      sessionId: appointments.triageSessionId,
    })
    .from(appointments)
    .where(and(eq(appointments.clinicId, clinicId), isNotNull(appointments.triageSessionId)));

  const sessionIds = linked.map((r) => r.sessionId!).filter(Boolean);

  if (sessionIds.length === 0) {
    // Also return unlinked sessions (same email as a patient with appointment in this clinic)
    return [];
  }

  return db
    .select()
    .from(triageSessions)
    .where(inArray(triageSessions.id, sessionIds))
    .orderBy(desc(triageSessions.createdAt));
}

export async function getPendingTriageCount(clinicId: string) {
  const linked = await db
    .select({ sessionId: appointments.triageSessionId })
    .from(appointments)
    .where(and(eq(appointments.clinicId, clinicId), isNotNull(appointments.triageSessionId)));

  const sessionIds = linked.map((r) => r.sessionId!).filter(Boolean);
  if (sessionIds.length === 0) return 0;

  const [result] = await db
    .select({ count: count() })
    .from(triageSessions)
    .where(and(inArray(triageSessions.id, sessionIds), eq(triageSessions.status, "PENDING")));

  return result?.count ?? 0;
}
