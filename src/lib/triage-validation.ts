import { z } from "zod";

const CLINIC_SPECIALTIES = [
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
] as const;

export const aiTriageOutputSchema = z.object({
  main_symptom: z.string().min(1),
  evolution_time: z.string().min(1),
  pain_intensity: z.number().int().min(1).max(10),
  relevant_history: z.string().min(1),
  urgency_classification: z.enum(["RED", "YELLOW", "GREEN"]),
  suggested_specialty: z.enum(CLINIC_SPECIALTIES).default("general_practice"),
  classification_justification: z.string().min(1),
  ai_summary: z.string().min(1),
});

export type AiTriageOutput = z.infer<typeof aiTriageOutputSchema>;

export const chatRequestSchema = z.object({
  patientName: z.string().min(2).max(120),
  patientEmail: z.string().email(),
  message: z.string().min(1).max(2000),
  locale: z.enum(["en", "pt"]).default("en"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .default([]),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const completeRequestSchema = z.object({
  patientName: z.string().min(2).max(120),
  patientEmail: z.string().email(),
  fullConversation: z.string().min(1),
  messageCount: z.number().int().min(1),
  locale: z.enum(["en", "pt"]).default("en"),
});

export type CompleteRequest = z.infer<typeof completeRequestSchema>;
