import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { appointments, preAnamnesis, clinics } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Calendar, CheckCircle, ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/queries";
import { PreAnamnesisClient } from "./PreAnamnesisClient";

export default async function PreAnamnesisPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const [row] = await db
    .select({
      appointment: appointments,
      clinicName: clinics.name,
    })
    .from(appointments)
    .leftJoin(clinics, eq(appointments.clinicId, clinics.id))
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!row || row.appointment.patientId !== user.id) notFound();

  // Already submitted? Show a confirmation instead of the form.
  const [existing] = await db
    .select({ id: preAnamnesis.id })
    .from(preAnamnesis)
    .where(eq(preAnamnesis.appointmentId, appointmentId))
    .limit(1);

  return (
    <div className="min-h-screen bg-[#F4FAFA]">
      <header className="bg-white border-b border-[#CCE8E8]">
        <div className="max-w-4xl mx-auto px-6 h-[68px] flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-[#56768A] hover:text-[#003049]">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0A9396] flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="font-syne font-extrabold text-[#003049] tracking-tight">MedBook</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <h1 className="font-syne font-extrabold text-3xl text-[#003049]">Pre-Screening Form</h1>
          <p className="text-[#56768A] mt-2">
            {row.clinicName} · Help your provider prepare for your visit
          </p>
        </div>

        {existing ? (
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-[#CCE8E8] shadow-card p-10 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-[#E0F4F4] flex items-center justify-center">
                <CheckCircle className="w-9 h-9 text-[#0A9396]" />
              </div>
            </div>
            <h2 className="font-syne font-bold text-xl text-[#003049]">Already submitted</h2>
            <p className="text-sm text-[#56768A]">
              You've completed the pre-screening for this appointment. Your provider will review it before your visit.
            </p>
            <Link href="/dashboard" className="btn-teal inline-block">Back to dashboard</Link>
          </div>
        ) : (
          <PreAnamnesisClient appointmentId={appointmentId} patientName={user.name} />
        )}
      </main>
    </div>
  );
}
