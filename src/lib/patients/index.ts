import { db } from "@/db";
import { chatSessions, chatMessages } from "@/db/schema";
import { eq, desc, sql, and, ilike, or } from "drizzle-orm";

export interface Patient {
  id: string;
  sessionId: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  messageCount: number;
  lastMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getPatients(
  clinicId: string,
  search?: string,
  limit = 50,
  offset = 0
): Promise<Patient[]> {
  const conditions = [eq(chatSessions.clinicId, clinicId)];

  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        ilike(chatSessions.patientName, searchPattern),
        ilike(chatSessions.patientPhone, searchPattern),
        ilike(chatSessions.patientEmail, searchPattern)
      )!
    );
  }

  const sessions = await db
    .select({
      id: chatSessions.id,
      sessionId: chatSessions.sessionId,
      name: chatSessions.patientName,
      phone: chatSessions.patientPhone,
      email: chatSessions.patientEmail,
      createdAt: chatSessions.createdAt,
      updatedAt: chatSessions.updatedAt,
    })
    .from(chatSessions)
    .where(and(...conditions))
    .orderBy(desc(chatSessions.updatedAt))
    .limit(limit)
    .offset(offset);

  // Get message counts and last message for each session
  const patients: Patient[] = [];

  for (const session of sessions) {
    const messages = await db
      .select({
        count: sql<number>`count(*)::int`,
        lastContent: chatMessages.content,
      })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, session.sessionId))
      .groupBy(chatMessages.content);

    const messageCount = messages[0]?.count || 0;
    const lastMessage = messages[0]?.lastContent || null;

    patients.push({
      ...session,
      messageCount,
      lastMessage,
    });
  }

  return patients;
}

export async function getPatientBySessionId(sessionId: string) {
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.sessionId, sessionId))
    .limit(1);

  if (!session) return null;

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt);

  return { ...session, messages };
}

export async function getPatientCount(clinicId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatSessions)
    .where(eq(chatSessions.clinicId, clinicId));

  return result?.count || 0;
}
