"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, clinics } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser, getClinicByOwner } from "@/lib/queries";
import { slugify } from "@/lib/utils";
import { z } from "zod";

// ─── Profile ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
});

export async function updateProfile(
  data: unknown
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: "Invalid data." };

  await db
    .update(users)
    .set({ name: parsed.data.name, phone: parsed.data.phone ?? null, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  revalidatePath("/settings/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}

// ─── Clinic ───────────────────────────────────────────────────────────────────

const clinicSchema = z.object({
  name: z.string().min(2, "Clinic name must be at least 2 characters"),
  specialty: z.enum([
    "general_practice", "dentistry", "aesthetics", "cardiology",
    "dermatology", "neurology", "orthopedics", "ophthalmology",
    "gynecology", "pediatrics", "psychiatry", "other",
  ]),
  description: z.string().optional(),
  phone: z.string().min(6, "Phone is required"),
  email: z.string().email("Invalid email"),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default("US"),
});

export async function saveClinic(
  data: unknown
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not authenticated." };
  if (user.role !== "clinic_admin") return { ok: false, error: "Only clinic admins can manage a clinic." };

  const parsed = clinicSchema.safeParse(data);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid data.";
    return { ok: false, error: msg };
  }

  const slug = slugify(parsed.data.name);
  const existing = await getClinicByOwner(user.id);

  try {
    if (existing) {
      await db
        .update(clinics)
        .set({ ...parsed.data, slug, updatedAt: new Date() })
        .where(eq(clinics.id, existing.id));
    } else {
      await db.insert(clinics).values({
        ...parsed.data,
        slug,
        ownerId: user.id,
      });
    }
  } catch (e: any) {
    if (e?.message?.includes("unique") || e?.code === "23505") {
      return { ok: false, error: "A clinic with this name already exists. Try a slightly different name." };
    }
    return { ok: false, error: "Failed to save. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/clinic");
  redirect("/dashboard");
}
