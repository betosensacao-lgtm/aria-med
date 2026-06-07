import Link from "next/link";
import { Calendar, CheckCircle, AlertCircle, Plus, Clock, MapPin } from "lucide-react";
import { getPatientAppointments } from "@/lib/queries";
import { formatDate, formatTime, getStatusColor } from "@/lib/utils";

export async function PatientAppointmentsView({ patientId }: { patientId: string }) {
  const appts = await getPatientAppointments(patientId);

  const upcoming = appts.filter(a => ["pending", "confirmed"].includes(a.status));
  const past = appts.filter(a => ["completed", "cancelled", "no_show"].includes(a.status));

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-extrabold text-3xl text-[#003049] tracking-tight">
            My Appointments
          </h1>
          <p className="text-[#56768A] mt-1 text-sm">Your bookings and visit history</p>
        </div>
        <Link href="/booking" className="btn-teal text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Book Appointment
        </Link>
      </div>

      {appts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#CCE8E8] p-16 text-center">
          <Calendar className="w-12 h-12 text-[#CCE8E8] mx-auto mb-4" />
          <p className="text-[#56768A] font-semibold text-lg">No appointments yet</p>
          <p className="text-xs text-[#56768A] mt-1 mb-5">Browse clinics and book your first appointment.</p>
          <Link href="/booking" className="btn-teal text-sm inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Find Clinics
          </Link>
        </div>
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-syne font-bold text-lg text-[#003049]">Upcoming</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcoming.map(a => (
                  <ApptCard key={a.id} appt={a} highlight />
                ))}
              </div>
            </section>
          )}

          {/* Past */}
          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-syne font-bold text-lg text-[#003049]">Past</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {past.map(a => (
                  <ApptCard key={a.id} appt={a} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ApptCard({
  appt,
  highlight,
}: {
  appt: Awaited<ReturnType<typeof getPatientAppointments>>[number];
  highlight?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#CCE8E8] shadow-card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#E0F4F4] flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-[#0A9396]" />
          </div>
          <div>
            <p className="font-semibold text-[#003049]">{appt.clinic?.name ?? "Clinic"}</p>
            <p className="text-xs text-[#56768A]">
              {appt.professional?.name} · {appt.professional?.specialty}
            </p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${getStatusColor(appt.status)}`}>
          {appt.status.replace("_", " ")}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-[#003049] pt-3 border-t border-[#CCE8E8]">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-[#56768A]" /> {formatDate(appt.date)}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-[#56768A]" /> {formatTime(appt.startTime)}
        </div>
      </div>

      {highlight && (
        <div className="pt-1">
          {appt.hasPreAnamnesis ? (
            <span className="flex items-center gap-1.5 text-xs text-[#0A9396] font-semibold">
              <CheckCircle className="w-3.5 h-3.5" /> Pre-screening submitted
            </span>
          ) : (
            <Link
              href={`/pre-anamnesis/${appt.id}`}
              className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold hover:underline"
            >
              <AlertCircle className="w-3.5 h-3.5" /> Complete pre-screening →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
