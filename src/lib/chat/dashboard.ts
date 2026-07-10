import { db } from "@/db";
import { chatSessions, chatMessages } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface DashboardStats {
  totalSessions: number;
  sessionsToday: number;
  totalMessages: number;
  messagesToday: number;
  recentSessions: Array<{
    sessionId: string;
    patientName: string | null;
    patientPhone: string | null;
    patientEmail: string | null;
    messageCount: number;
    createdAt: Date;
  }>;
}

export async function getDashboardStats(clinicId?: string): Promise<DashboardStats> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const hasFilter = !!clinicId;

  const [totalSessions] = hasFilter
    ? await db.select({ value: sql<number>`count(*)::int` }).from(chatSessions).where(eq(chatSessions.clinicId, clinicId!))
    : await db.select({ value: sql<number>`count(*)::int` }).from(chatSessions);

  const [sessionsToday] = hasFilter
    ? await db.select({ value: sql<number>`count(*)::int` }).from(chatSessions).where(sql`clinic_id = ${clinicId} AND created_at >= ${todayStart}`)
    : await db.select({ value: sql<number>`count(*)::int` }).from(chatSessions).where(sql`created_at >= ${todayStart}`);

  const [totalMessages] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(chatMessages);

  const [messagesToday] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(chatMessages)
    .where(sql`created_at >= ${todayStart}`);

  const rows = hasFilter
    ? await db.select({
        sessionId: chatSessions.sessionId,
        patientName: chatSessions.patientName,
        patientPhone: chatSessions.patientPhone,
        patientEmail: chatSessions.patientEmail,
        createdAt: chatSessions.createdAt,
      }).from(chatSessions).where(eq(chatSessions.clinicId, clinicId!)).orderBy(desc(chatSessions.createdAt)).limit(20)
    : await db.select({
        sessionId: chatSessions.sessionId,
        patientName: chatSessions.patientName,
        patientPhone: chatSessions.patientPhone,
        patientEmail: chatSessions.patientEmail,
        createdAt: chatSessions.createdAt,
      }).from(chatSessions).orderBy(desc(chatSessions.createdAt)).limit(20);

  const recentSessions = [];
  for (const row of rows) {
    const [msgCount] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, row.sessionId));

    recentSessions.push({
      ...row,
      messageCount: msgCount?.value ?? 0,
    });
  }

  return {
    totalSessions: totalSessions?.value ?? 0,
    sessionsToday: sessionsToday?.value ?? 0,
    totalMessages: totalMessages?.value ?? 0,
    messagesToday: messagesToday?.value ?? 0,
    recentSessions,
  };
}
