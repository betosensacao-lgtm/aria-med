import { db } from "@/db";
import { pricingPlans } from "@/db/schema";
import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/admin/plans — list all pricing plans
export async function GET() {
  try {
    const plans = await db
      .select()
      .from(pricingPlans)
      .where(asc(pricingPlans.sortOrder));

    return NextResponse.json(plans);
  } catch (error) {
    console.error("[Plans API] Error:", error);
    return NextResponse.json({ error: "Erro ao buscar planos" }, { status: 500 });
  }
}
