import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  uuid,
  pgEnum,
  jsonb,
  date,
  time,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "patient",
  "clinic_admin",
  "professional",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

export const clinicSpecialtyEnum = pgEnum("clinic_specialty", [
  "general_practice",
  "dentistry",
  "aesthetics",
  "cardiology",
  "dermatology",
  "neurology",
  "orthopedics",
  "ophthalmology",
  "gynecology",
  "pediatrics",
  "psychiatry",
  "other",
]);

export const genderEnum = pgEnum("gender", [
  "male",
  "female",
  "other",
  "prefer_not_to_say",
]);

// Maps to existing DB enum "urgency_classification" (created by ARIA-Med)
export const triageUrgencyEnum = pgEnum("urgency_classification", ["RED", "YELLOW", "GREEN"]);

// Maps to existing DB enum "triage_status"
export const triageStatusEnum = pgEnum("triage_status", ["PENDING", "REVIEWED", "ARCHIVED"]);

// ─── Tables ──────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("patient"),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  supabaseId: text("supabase_id").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const clinics = pgTable("clinics", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  specialty: clinicSpecialtyEnum("specialty").notNull(),
  description: text("description"),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  logoUrl: text("logo_url"),
  coverUrl: text("cover_url"),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  // Address (flat for simplicity)
  street: text("street"),
  addressNumber: text("address_number"),
  complement: text("complement"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("US"),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const professionals = pgTable("professionals", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  registrationNumber: text("registration_number"), // CRM/license
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  availableDays: jsonb("available_days").$type<number[]>().default([1, 2, 3, 4, 5]),
  workingHoursStart: time("working_hours_start").default("08:00"),
  workingHoursEnd: time("working_hours_end").default("18:00"),
  slotDuration: integer("slot_duration").notNull().default(30), // minutes
  breakStart: time("break_start"),
  breakEnd: time("break_end"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const triageSessions = pgTable("triage_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientName: text("patient_name").notNull(),
  patientEmail: text("patient_email").notNull(),
  mainSymptom: text("main_symptom"),
  // DB column is "evolution_time" (from ARIA-Med); kept for backward compat
  evolutionTime: text("evolution_time"),
  painIntensity: integer("pain_intensity"),
  relevantHistory: text("relevant_history"),
  // DB column/enum is "urgency_classification" (from ARIA-Med)
  urgency: triageUrgencyEnum("urgency_classification"),
  suggestedSpecialty: clinicSpecialtyEnum("suggested_specialty"),
  // Extra ARIA-Med columns — kept for data continuity
  classificationJustification: text("classification_justification"),
  aiSummary: text("ai_summary"),
  messageCount: integer("message_count").default(0),
  modelUsed: text("model_used"),
  status: triageStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const triageMessages = pgTable("triage_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => triageSessions.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => users.id),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id),
  professionalId: uuid("professional_id").notNull().references(() => professionals.id),
  triageSessionId: uuid("triage_session_id").references(() => triageSessions.id),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  status: appointmentStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  reminderSentAt: timestamp("reminder_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const preAnamnesis = pgTable("pre_anamnesis", {
  id: uuid("id").primaryKey().defaultRandom(),
  appointmentId: uuid("appointment_id").notNull().references(() => appointments.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").notNull().references(() => users.id),

  // Personal
  fullName: text("full_name").notNull(),
  dateOfBirth: date("date_of_birth"),
  gender: genderEnum("gender"),
  phone: text("phone"),
  emergencyContact: text("emergency_contact"),

  // Chief complaint
  chiefComplaint: text("chief_complaint").notNull(),
  symptomsDescription: text("symptoms_description"),
  symptomsDuration: text("symptoms_duration"),
  painScale: integer("pain_scale"), // 0-10

  // Medical history
  currentMedications: jsonb("current_medications").$type<string[]>().default([]),
  allergies: jsonb("allergies").$type<string[]>().default([]),
  chronicConditions: jsonb("chronic_conditions").$type<string[]>().default([]),
  previousSurgeries: text("previous_surgeries"),
  familyHistory: text("family_history"),

  // Vitals
  bloodType: text("blood_type"),
  height: real("height"),
  weight: real("weight"),

  // Insurance
  hasInsurance: boolean("has_insurance").notNull().default(false),
  insuranceProvider: text("insurance_provider"),
  insurancePlanNumber: text("insurance_plan_number"),

  // Consent
  consentGiven: boolean("consent_given").notNull().default(false),
  consentDate: timestamp("consent_date"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const clinicsRelations = relations(clinics, ({ one, many }) => ({
  owner: one(users, { fields: [clinics.ownerId], references: [users.id] }),
  professionals: many(professionals),
  appointments: many(appointments),
}));

export const professionalsRelations = relations(professionals, ({ one, many }) => ({
  clinic: one(clinics, { fields: [professionals.clinicId], references: [clinics.id] }),
  user: one(users, { fields: [professionals.userId], references: [users.id] }),
  appointments: many(appointments),
}));

export const triageSessionsRelations = relations(triageSessions, ({ many }) => ({
  messages: many(triageMessages),
  appointments: many(appointments),
}));

export const triageMessagesRelations = relations(triageMessages, ({ one }) => ({
  session: one(triageSessions, { fields: [triageMessages.sessionId], references: [triageSessions.id] }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(users, { fields: [appointments.patientId], references: [users.id] }),
  clinic: one(clinics, { fields: [appointments.clinicId], references: [clinics.id] }),
  professional: one(professionals, { fields: [appointments.professionalId], references: [professionals.id] }),
  preAnamnesis: one(preAnamnesis, { fields: [appointments.id], references: [preAnamnesis.appointmentId] }),
  triageSession: one(triageSessions, { fields: [appointments.triageSessionId], references: [triageSessions.id] }),
}));

export const preAnamnesisRelations = relations(preAnamnesis, ({ one }) => ({
  appointment: one(appointments, { fields: [preAnamnesis.appointmentId], references: [appointments.id] }),
  patient: one(users, { fields: [preAnamnesis.patientId], references: [users.id] }),
}));
