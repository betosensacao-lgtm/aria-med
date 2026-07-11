import { db } from "@/db";
import { adminUsers, clinics, chatSessions, chatMessages, documents } from "@/db/schema";
import { eq, sql, desc, and, gte } from "drizzle-orm";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ClinicActions } from "./ClinicActions";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  // System stats
  const [userCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(adminUsers);

  const [clinicCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(clinics);

  const [sessionCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatSessions);

  const [messageCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatMessages);

  const [docCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(documents);

  // Sessions today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [sessionsToday] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatSessions)
    .where(gte(chatSessions.createdAt, today));

  // All clinics with owner info
  const allClinics = await db
    .select({
      id: clinics.id,
      name: clinics.name,
      slug: clinics.slug,
      specialty: clinics.specialty,
      plan: clinics.plan,
      isVerified: clinics.isVerified,
      subscriptionStatus: clinics.subscriptionStatus,
      createdAt: clinics.createdAt,
    })
    .from(clinics)
    .orderBy(desc(clinics.createdAt));

  // All users
  const users = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      isActive: adminUsers.isActive,
      clinicId: adminUsers.clinicId,
      lastLoginAt: adminUsers.lastLoginAt,
      createdAt: adminUsers.createdAt,
    })
    .from(adminUsers)
    .orderBy(adminUsers.createdAt);

  // Plan distribution
  const planStats = await db
    .select({
      plan: clinics.plan,
      count: sql<number>`count(*)::int`,
    })
    .from(clinics)
    .groupBy(clinics.plan);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Super Admin"
        description="Visao completa do sistema MedBook"
      />

      {/* System Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          label="Usuarios"
          value={userCount.count}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <StatCard
          label="Clinicas"
          value={clinicCount.count}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard
          label="Conversas Hoje"
          value={sessionsToday.count}
          variant="highlight"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
        />
        <StatCard
          label="Total Conversas"
          value={sessionCount.count}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          label="Mensagens"
          value={messageCount.count}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
        />
        <StatCard
          label="Documentos"
          value={docCount.count}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
      </div>

      {/* Clinic Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Clinicas</h2>
            <div className="flex gap-2">
              {planStats.map((p) => (
                <Badge key={p.plan} variant={p.plan === "enterprise" ? "purple" : p.plan === "professional" ? "info" : "default"}>
                  {p.plan}: {p.count}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {allClinics.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhuma clinica cadastrada ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3 font-medium">Nome</th>
                    <th className="text-left px-5 py-3 font-medium">Especialidade</th>
                    <th className="text-center px-5 py-3 font-medium">Plano</th>
                    <th className="text-center px-5 py-3 font-medium">Status</th>
                    <th className="text-center px-5 py-3 font-medium">Verificada</th>
                    <th className="text-right px-5 py-3 font-medium">Criada em</th>
                    <th className="text-right px-5 py-3 font-medium">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allClinics.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-gray-900 font-medium">{c.name}</p>
                          <p className="text-xs text-gray-500">/{c.slug}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600 capitalize">
                        {c.specialty.replace(/_/g, " ")}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge variant={c.plan === "enterprise" ? "purple" : c.plan === "professional" ? "info" : "default"}>
                          {c.plan}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge variant={c.subscriptionStatus === "active" ? "success" : c.subscriptionStatus === "trialing" ? "warning" : "default"}>
                          {c.subscriptionStatus || "free"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {c.isVerified ? (
                          <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-400 text-xs">
                        {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <ClinicActions clinicId={c.id} clinicName={c.name} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Usuarios do Sistema</h2>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Nome</th>
                  <th className="text-left px-5 py-3 font-medium">Email</th>
                  <th className="text-center px-5 py-3 font-medium">Funcao</th>
                  <th className="text-center px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Ultimo Login</th>
                  <th className="text-right px-5 py-3 font-medium">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-900 font-medium">{u.name}</td>
                    <td className="px-5 py-3 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3 text-center">
                      <Badge variant={u.role === "super_admin" ? "purple" : "info"}>
                        {u.role === "super_admin" ? "Super Admin" : "Admin"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Badge variant={u.isActive ? "success" : "danger"}>
                        {u.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Nunca"}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
