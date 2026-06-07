import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Users, Mail, Phone, Calendar } from "lucide-react";
import { getCurrentUser, getClinicByOwner, getPatientsWithLastDate } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { PatientSearch } from "./components/PatientSearch";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const clinic = await getClinicByOwner(user.id);
  if (!clinic) redirect("/dashboard");

  const { q } = await searchParams;
  const patients = await getPatientsWithLastDate(clinic.id, q);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-syne font-extrabold text-3xl text-[#003049] tracking-tight">Patients</h1>
        <p className="text-[#56768A] mt-1 text-sm">{clinic.name}</p>
      </div>

      {/* Search */}
      <Suspense fallback={<div className="h-10 bg-[#F4FAFA] rounded-xl animate-pulse" />}>
        <PatientSearch total={patients.length} />
      </Suspense>

      {/* Table */}
      {patients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#CCE8E8] p-16 text-center">
          <Users className="w-12 h-12 text-[#CCE8E8] mx-auto mb-4" />
          <p className="text-[#56768A] font-semibold text-lg">
            {q ? "No patients match your search" : "No patients yet"}
          </p>
          <p className="text-xs text-[#56768A] mt-1">
            {q ? "Try a different name." : "Patients will appear here once they book appointments."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#CCE8E8] overflow-hidden shadow-card">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F4FAFA] border-b border-[#CCE8E8]">
                {["Patient", "Contact", "Appointments", "Last Visit", ""].map(h => (
                  <th
                    key={h}
                    className={`text-left text-xs font-semibold text-[#56768A] uppercase tracking-wide px-6 py-4 ${
                      h === "Contact" ? "hidden md:table-cell" : h === "Last Visit" ? "hidden lg:table-cell" : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id} className="border-b border-[#CCE8E8] last:border-0 hover:bg-[#F4FAFA] transition-colors">
                  {/* Patient */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A9396] to-[#003049] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {p.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[#003049] text-sm">{p.name}</p>
                        <p className="text-xs text-[#56768A]">Since {formatDate(p.createdAt)}</p>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-[#56768A]">
                        <Mail className="w-3 h-3" /> {p.email}
                      </div>
                      {p.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-[#56768A]">
                          <Phone className="w-3 h-3" /> {p.phone}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Appointments count */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-7 h-7 rounded-lg bg-[#E0F4F4] flex items-center justify-center">
                        <span className="text-xs font-bold text-[#0A9396]">{p.appointmentCount}</span>
                      </div>
                      <span className="text-xs text-[#56768A]">visits</span>
                    </div>
                  </td>

                  {/* Last visit */}
                  <td className="px-6 py-4 hidden lg:table-cell">
                    {p.lastAppointment ? (
                      <div className="flex items-center gap-1.5 text-sm text-[#003049]">
                        <Calendar className="w-3.5 h-3.5 text-[#56768A]" />
                        {formatDate(p.lastAppointment)}
                      </div>
                    ) : (
                      <span className="text-xs text-[#56768A]">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <button className="text-xs font-semibold text-[#0A9396] hover:underline opacity-50 cursor-not-allowed" disabled>
                      View
                    </button>
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
