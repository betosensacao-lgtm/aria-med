import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar, Users, CheckCircle, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { getCurrentUser, getClinicByOwner, getDashboardStats, getTodayAppointments } from "@/lib/queries";
import { getStatusColor, formatTime } from "@/lib/utils";
import { format } from "date-fns";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  // ── Patient view ──────────────────────────────────────────────────────────
  if (user.role === "patient") {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#E0F4F4] flex items-center justify-center">
          <Calendar className="w-7 h-7 text-[#0A9396]" />
        </div>
        <h1 className="font-syne font-extrabold text-2xl text-[#003049]">
          {getGreeting()}, {user.name.split(" ")[0]}! 👋
        </h1>
        <p className="text-[#56768A] max-w-sm">
          Book your first appointment to get started.
        </p>
        <Link href="/booking" className="btn-teal">Browse Clinics</Link>
      </div>
    );
  }

  // ── Clinic admin: no clinic yet ───────────────────────────────────────────
  const clinic = await getClinicByOwner(user.id);

  if (!clinic) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#E0F4F4] flex items-center justify-center">
          <Calendar className="w-7 h-7 text-[#0A9396]" />
        </div>
        <h1 className="font-syne font-extrabold text-2xl text-[#003049]">Set up your clinic</h1>
        <p className="text-[#56768A] max-w-sm">
          Create your clinic profile to start receiving appointments.
        </p>
        <Link href="/settings/clinic" className="btn-teal">Create Clinic</Link>
      </div>
    );
  }

  // ── Clinic admin: full dashboard ──────────────────────────────────────────
  const [stats, todayAppts] = await Promise.all([
    getDashboardStats(clinic.id),
    getTodayAppointments(clinic.id),
  ]);

  const statCards = [
    {
      label: "Today's Appointments",
      value: String(stats.todayAppointments),
      icon: Calendar,
      color: "text-[#0A9396]",
      bg: "bg-[#E0F4F4]",
      delta: `${todayAppts.filter(a => a.status === "confirmed").length} confirmed`,
    },
    {
      label: "Total Patients",
      value: String(stats.totalPatients),
      icon: Users,
      color: "text-[#003049]",
      bg: "bg-[#E0F4F4]",
      delta: "Unique patients",
    },
    {
      label: "Completed This Month",
      value: String(stats.completedThisMonth),
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
      delta: format(new Date(), "MMMM yyyy"),
    },
    {
      label: "Pending Confirmations",
      value: String(stats.pendingConfirmations),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      delta: stats.pendingConfirmations > 0 ? "Needs attention" : "All clear ✓",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-syne font-extrabold text-3xl text-[#003049] tracking-tight">
            {getGreeting()}, {user.name.split(" ")[0]}! 👋
          </h1>
          <p className="text-[#56768A] mt-1">
            {clinic.name} · {format(new Date(), "EEEE, MMMM dd")}
          </p>
        </div>
        <Link href="/appointments" className="btn-teal text-sm">
          + New Appointment
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card-brand p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-[#56768A]" />
              </div>
              <div className="font-syne font-extrabold text-3xl text-[#003049]">{s.value}</div>
              <div className="text-xs text-[#56768A] mt-0.5">{s.label}</div>
              <div className="text-xs text-[#0A9396] font-medium mt-2">{s.delta}</div>
            </div>
          );
        })}
      </div>

      {/* Today's Schedule */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-syne font-bold text-xl text-[#003049]">Today's Schedule</h2>
          <Link href="/appointments" className="text-sm text-[#0A9396] font-semibold hover:underline">
            View all
          </Link>
        </div>

        {todayAppts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#CCE8E8] p-12 text-center">
            <Calendar className="w-10 h-10 text-[#CCE8E8] mx-auto mb-3" />
            <p className="text-[#56768A] font-medium">No appointments today</p>
            <p className="text-xs text-[#56768A] mt-1">
              Appointments booked for today will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#CCE8E8] overflow-hidden shadow-card">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F4FAFA] border-b border-[#CCE8E8]">
                  {["Time", "Patient", "Professional", "Status", "Pre-Screening", ""].map(h => (
                    <th
                      key={h}
                      className={`text-left text-xs font-semibold text-[#56768A] uppercase tracking-wide px-6 py-4 ${
                        h === "Professional" ? "hidden md:table-cell" :
                        h === "Pre-Screening" ? "hidden lg:table-cell" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {todayAppts.map((appt) => (
                  <tr
                    key={appt.id}
                    className="border-b border-[#CCE8E8] last:border-0 hover:bg-[#F4FAFA] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-syne font-bold text-[#003049]">
                        {formatTime(appt.startTime)}
                      </span>
                    </td>
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
                        <span className="font-medium text-[#003049] text-sm">
                          {appt.patient?.name ?? "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-[#56768A]">
                        {appt.professional?.name ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${getStatusColor(appt.status)}`}>
                        {appt.status.replace("_", " ")}
                      </span>
                    </td>
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
                    <td className="px-6 py-4">
                      <Link
                        href={`/appointments/${appt.id}`}
                        className="text-xs font-semibold text-[#0A9396] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
