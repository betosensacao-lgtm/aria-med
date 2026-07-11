import { db } from "@/db";
import { chatSessions, chatMessages } from "@/db/schema";
import { eq, sql, and, gte, lt, desc } from "drizzle-orm";

export interface HourlyDistribution {
  hour: number;
  count: number;
}

export interface DailyTrend {
  date: string;
  sessions: number;
  messages: number;
}

export interface AnalyticsSummary {
  totalSessions: number;
  totalMessages: number;
  avgMessagesPerSession: number;
  sessionsToday: number;
  messagesToday: number;
  peakHour: number;
  hourlyDistribution: HourlyDistribution[];
  dailyTrend: DailyTrend[];
  topPatients: { name: string | null; phone: string | null; count: number }[];
}

export async function getChatAnalytics(
  clinicId: string,
  days = 30
): Promise<AnalyticsSummary> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  // Total sessions
  const [totalSessions] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatSessions)
    .where(eq(chatSessions.clinicId, clinicId));

  // Total messages
  const [totalMessages] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatMessages)
    .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.sessionId))
    .where(eq(chatSessions.clinicId, clinicId));

  // Sessions today
  const [sessionsToday] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.clinicId, clinicId),
        gte(chatSessions.createdAt, startOfDay)
      )
    );

  // Messages today
  const [messagesToday] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatMessages)
    .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.sessionId))
    .where(
      and(
        eq(chatSessions.clinicId, clinicId),
        gte(chatMessages.createdAt, startOfDay)
      )
    );

  // Hourly distribution (last 7 days)
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const hourlyData = await db
    .select({
      hour: sql<number>`extract(hour from ${chatSessions.createdAt})::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.clinicId, clinicId),
        gte(chatSessions.createdAt, weekAgo)
      )
    )
    .groupBy(sql`extract(hour from ${chatSessions.createdAt})`)
    .orderBy(sql`extract(hour from ${chatSessions.createdAt})`);

  // Fill missing hours
  const hourlyDistribution: HourlyDistribution[] = [];
  for (let h = 0; h < 24; h++) {
    const found = hourlyData.find((d) => d.hour === h);
    hourlyDistribution.push({ hour: h, count: found?.count || 0 });
  }

  const peakHour = hourlyDistribution.reduce(
    (max, h) => (h.count > max.count ? h : max),
    { hour: 0, count: 0 }
  ).hour;

  // Daily trend (last N days)
  const dailyTrend: DailyTrend[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const [sessions] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.clinicId, clinicId),
          gte(chatSessions.createdAt, date),
          lt(chatSessions.createdAt, nextDate)
        )
      );

    const [messages] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(chatMessages)
      .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.sessionId))
      .where(
        and(
          eq(chatSessions.clinicId, clinicId),
          gte(chatMessages.createdAt, date),
          lt(chatMessages.createdAt, nextDate)
        )
      );

    dailyTrend.push({
      date: date.toISOString().split("T")[0],
      sessions: sessions.count,
      messages: messages.count,
    });
  }

  // Top patients
  const topPatients = await db
    .select({
      name: chatSessions.patientName,
      phone: chatSessions.patientPhone,
      count: sql<number>`count(*)::int`,
    })
    .from(chatSessions)
    .where(eq(chatSessions.clinicId, clinicId))
    .groupBy(chatSessions.patientName, chatSessions.patientPhone)
    .orderBy(desc(sql`count(*)::int`))
    .limit(10);

  const avgMessagesPerSession =
    totalSessions.count > 0
      ? Math.round((totalMessages.count / totalSessions.count) * 10) / 10
      : 0;

  return {
    totalSessions: totalSessions.count,
    totalMessages: totalMessages.count,
    avgMessagesPerSession,
    sessionsToday: sessionsToday.count,
    messagesToday: messagesToday.count,
    peakHour,
    hourlyDistribution,
    dailyTrend,
    topPatients: topPatients.map((p) => ({
      name: p.name,
      phone: p.phone,
      count: p.count,
    })),
  };
}
