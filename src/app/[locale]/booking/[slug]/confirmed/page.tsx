import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { appointments, clinics, professionals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CheckCircle, Calendar, Clock, MapPin, ClipboardList, LayoutDashboard } from "lucide-react";
import { getCurrentUser } from "@/lib/queries";
import { formatDate, formatTime } from "@/lib/utils";

export default async function ConfirmedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ appt?: string }>;
}) {
  const { slug } = await params;
  const { appt } = await searchParams;
  if (!appt) notFound();

  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const [row] = await db
    .select({
      appointment: appointments,
      clinic: { name: clinics.name },
      professional: { name: professionals.name, specialty: professionals.specialty },
    })
    .from(appointments)
    .leftJoin(clinics, eq(appointments.clinicId, clinics.id))
    .leftJoin(professionals, eq(appointments.professionalId, professionals.id))
    .where(eq(appointments.id, appt))
    .limit(1);

  // Only the patient who booked can view their confirmation
  if (!row || row.appointment.patientId !== user.id) notFound();

  return (
    <div className="min-h-screen bg-[#F4FAFA] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="bg-white rounded-2xl border border-[#CCE8E8] shadow-card p-8 text-center space-y-5">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-[#E0F4F4] flex items-center justify-center">
              <CheckCircle className="w-9 h-9 text-[#0A9396]" />
            </div>
          </div>

          <div>
            <h1 className="font-syne font-extrabold text-2xl text-[#003049]">Appointment booked!</h1>
            <p className="text-[#56768A] text-sm mt-1">
              Your request was sent. The clinic will confirm shortly.
            </p>
          </div>

          {/* Summary */}
          <div className="bg-[#F4FAFA] rounded-xl border border-[#CCE8E8] p-5 text-left space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-[#0A9396] flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#003049]">{row.clinic?.name}</p>
                <p className="text-xs text-[#56768A]">
                  {row.professional?.name} · {row.professional?.specialty}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[#0A9396] flex-shrink-0" />
              <p className="text-sm text-[#003049]">{formatDate(row.appointment.date, "EEEE, MMMM dd, yyyy")}</p>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-[#0A9396] flex-shrink-0" />
              <p className="text-sm text-[#003049]">
                {formatTime(row.appointment.startTime)} – {formatTime(row.appointment.endTime)}
              </p>
            </div>
          </div>

          {/* Pre-anamnesis CTA */}
          <div className="bg-[#E0F4F4] rounded-xl p-4 text-left flex items-start gap-3">
            <ClipboardList className="w-5 h-5 text-[#0A9396] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#003049]">Complete your pre-screening</p>
              <p className="text-xs text-[#56768A] mt-0.5">
                Fill out your health form now so your provider is ready for your visit.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href={`/pre-anamnesis/${row.appointment.id}`}
              className="btn-teal w-full flex items-center justify-center gap-2"
            >
              <ClipboardList className="w-4 h-4" /> Complete Pre-Screening
            </Link>
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-[#56768A] hover:text-[#003049] py-2"
            >
              <LayoutDashboard className="w-4 h-4" /> Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
