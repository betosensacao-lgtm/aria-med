import { config } from "dotenv";
import { resolve } from "path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../src/db/schema";
import { pricingPlans } from "../src/db/schema";
import { eq } from "drizzle-orm";

config({ path: resolve(__dirname, "../.env.local") });

const PLANS = [
  {
    name: "Starter",
    slug: "starter",
    description: "Ideal para clinicas pequenas comecando com atendimento digital.",
    priceMonthly: 9700,
    priceYearly: 97000,
    maxProfessionals: 1,
    maxConversationsMonthly: 500,
    features: [
      "1 profissional",
      "Chat IA com respostas basicas",
      "Widget de chat no site",
      "Agendamento via Google Calendar",
      "Ate 500 conversas/mes",
      "Suporte por e-mail",
    ],
    highlighted: false,
    sortOrder: 1,
  },
  {
    name: "Profissional",
    slug: "professional",
    description: "Para clinicas em crescimento que querem escalar o atendimento.",
    priceMonthly: 19700,
    priceYearly: 197000,
    maxProfessionals: 5,
    maxConversationsMonthly: null,
    features: [
      "Ate 5 profissionais",
      "Chat IA avancado com personalizacao",
      "WhatsApp nativo + Chat web",
      "Agendamento + lembretes automaticos",
      "Conversoas ilimitadas",
      "Base de conhecimento (RAG)",
      "Relatorios e metricas",
      "Suporte prioritario via WhatsApp",
    ],
    highlighted: true,
    sortOrder: 2,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    description: "Solucao completa para redes e clinicas de grande porte.",
    priceMonthly: 39700,
    priceYearly: 397000,
    maxProfessionals: null,
    maxConversationsMonthly: null,
    features: [
      "Profissionais ilimitados",
      "IA treinada com base da clinica",
      "Multi-unidade",
      "WhatsApp + Chat + Calendario",
      "Conversoes ilimitadas",
      "Integracao com sistemas externos",
      "API disponivel",
      "Suporte dedicado + SLA",
      "Onboarding personalizado",
    ],
    highlighted: false,
    sortOrder: 3,
  },
];

async function main() {
  const client = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client, { schema });

  console.log("Seeding pricing plans...");

  for (const plan of PLANS) {
    const [existing] = await db
      .select()
      .from(pricingPlans)
      .where(eq(pricingPlans.slug, plan.slug))
      .limit(1);

    if (existing) {
      console.log(`  Updating "${plan.name}"...`);
      await db
        .update(pricingPlans)
        .set(plan)
        .where(eq(pricingPlans.id, existing.id));
    } else {
      console.log(`  Creating "${plan.name}"...`);
      await db.insert(pricingPlans).values(plan);
    }
  }

  console.log("Done! Plans seeded successfully.");
  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
