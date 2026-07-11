import { db } from "@/db";
import { adminUsers, clinics, chatSessions, chatMessages, documents, pricingPlans } from "@/db/schema";
import { eq, sql, desc, asc, gte } from "drizzle-orm";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ClinicActions } from "./ClinicActions";
import { ClinicsTable } from "./ClinicsTable";

export const dynamic = "force-dynamic";

function formatPrice(cents: number | null) {
  if (!cents) return "—";
  return `R$ ${(cents / 100).toFixed(0)}`;
}

export default async function SuperAdminPage() {
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [sessionsToday] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatSessions)
    .where(gte(chatSessions.createdAt, today));

  // All clinics with pricing plan info
  const allClinics = await db
    .select({
      id: clinics.id,
      name: clinics.name,
      slug: clinics.slug,
      specialty: clinics.specialty,
      phone: clinics.phone,
      email: clinics.email,
      city: clinics.city,
      state: clinics.state,
      isVerified: clinics.isVerified,
      billingCycle: clinics.billingCycle,
      trialEndsAt: clinics.trialEndsAt,
      conversationsUsedMonthly: clinics.conversationsUsedMonthly,
      plan: clinics.plan,
      subscriptionStatus: clinics.subscriptionStatus,
      createdAt: clinics.createdAt,
      // Plan join
      planId: clinics.planId,
      planName: pricingPlans.name,
      planSlug: pricingPlans.slug,
      planPrice: pricingPlans.priceMonthly,
      planMaxProfs: pricingPlans.maxProfessionals,
      planMaxConversations: pricingPlans.maxConversationsMonthly,
      planFeatures: pricingPlans.features,
      planHighlighted: pricingPlans.highlighted,
    })
    .from(clinics)
    .leftJoin(pricingPlans, eq(clinics.planId, pricingPlans.id))
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
      name: pricingPlans.name,
      slug: pricingPlans.slug,
      count: sql<number>`count(*)::int`,
    })
    .from(clinics)
    .leftJoin(pricingPlans, eq(clinics.planId, pricingPlans.id))
    .groupBy(pricingPlans.name, pricingPlans.slug);

  // Monthly revenue estimate
  const revenueEstimate = allClinics.reduce((sum, c) => {
    return sum + (c.planPrice || 0);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Super Admin"
        description="Visao completa do sistema MedBook"
      />

      {/* System Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
        <StatCard label="Usuarios" value={userCount.count} />
        <StatCard label="Clinicas" value={clinicCount.count} />
        <StatCard label="Conversas Hoje" value={sessionsToday.count} variant="highlight" />
        <StatCard label="Total Conversas" value={sessionCount.count} />
        <StatCard label="Mensagens" value={messageCount.count} />
        <StatCard label="Documentos" value={docCount.count} />
        <StatCard label="Receita Mensal" value={formatPrice(revenueEstimate)} />
      </div>

      {/* Clinic Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Clinicas</h2>
            <div className="flex gap-2">
              {planStats.map((p) => (
                <Badge key={p.slug || "none"} variant={p.slug === "enterprise" ? "purple" : p.slug === "professional" ? "info" : "default"}>
                  {p.name || "sem plano"}: {p.count}
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
            <ClinicsTable clinics={allClinics} />
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
