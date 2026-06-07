import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { getCurrentUser, getClinicByOwner, getAppointments } from "@/lib/queries";
import { formatDate, formatTime } from "@/lib/utils";
import { AppointmentFilters } from "./components/AppointmentFilters";
import { StatusSelect } from "./components/StatusSelect";
import { PatientAppointmentsView } from "./PatientView";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; date?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  // Patients see their own bookings; clinic admins see the clinic's schedule.
  if (user.role === "patient") {
    return <PatientAppointmentsView patientId={user.id} />;
  }

  const clinic = await getClinicByOwner(user.id);
  if (!clinic) redirect("/dashboard");

  const { status, date } = await searchParams;
  const data = await getAppointments(clinic.id, { status, date });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-extrabold text-3xl text-[#003049] tracking-tight">
            Appointments
          </h1>
          <p className="text-[#56768A] mt-1 text-sm">{clinic.name}</p>
        </div>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-10 bg-[#F4FAFA] rounded-xl animate-pulse" />}>
        <AppointmentFilters total={data.length} />
      </Suspense>

      {/* Table */}
      {data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#CCE8E8] p-16 text-center">
          <Calendar className="w-12 h-12 text-[#CCE8E8] mx-auto mb-4" />
          <p className="text-[#56768A] font-semibold text-lg">No appointments found</p>
          <p className="text-xs text-[#56768A] mt-1">
            {status || date ? "Try adjusting your filters." : "Appointments will appear here once patients book."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#CCE8E8] overflow-hidden shadow-card">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F4FAFA] border-b border-[#CCE8E8]">
                {[
                  { label: "Date & Time", classes: "" },
                  { label: "Patient", classes: "" },
                  { label: "Professional", classes: "hidden md:table-cell" },
                  { label: "Status", classes: "" },
                  { label: "Pre-Screening", classes: "hidden lg:table-cell" },
                  { label: "", classes: "" },
                ].map(({ label, classes }) => (
                  <th
                    key={label}
                    className={`text-left text-xs font-semibold text-[#56768A] uppercase tracking-wide px-6 py-4 ${classes}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((appt) => (
                <tr
                  key={appt.id}
                  className="border-b border-[#CCE8E8] last:border-0 hover:bg-[#F4FAFA] transition-colors"
                >
                  {/* Date & Time */}
                  <td className="px-6 py-4">
                    <div className="font-syne font-bold text-[#003049] text-sm">
                      {formatTime(appt.startTime)}
                    </div>
                    <div className="text-xs text-[#56768A] mt-0.5">
                      {formatDate(appt.date)}
                    </div>
                  </td>

                  {/* Patient */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0A9396] to-[#003049] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(appt.patient?.name ?? "?")
                          .split(" ")
                          .map(n => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-[#003049] text-sm">
                          {appt.patient?.name ?? "Unknown"}
                        </div>
                        <div className="text-xs text-[#56768A]">
                          {appt.patient?.email ?? ""}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Professional */}
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="text-sm text-[#003049] font-medium">
                      {appt.professional?.name ?? "—"}
                    </div>
                    <div className="text-xs text-[#56768A] capitalize">
                      {appt.professional?.specialty ?? ""}
                    </div>
                  </td>

                  {/* Status — inline edit */}
                  <td className="px-6 py-4">
                    <StatusSelect
                      appointmentId={appt.id}
                      currentStatus={appt.status}
                    />
                  </td>

                  {/* Pre-screening */}
                  <td className="px-6 py-4 hidden lg:table-cell">
                    {appt.hasPreAnamnesis ? (
                      <span className="flex items-center gap-1.5 text-xs text-[#0A9396] font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" /> Submitted
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <Link
                      href={`/appointments/${appt.id}`}
                      className="text-xs font-semibold text-[#0A9396] hover:underline"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
