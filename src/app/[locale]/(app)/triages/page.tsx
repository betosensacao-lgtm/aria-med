import { redirect } from "next/navigation";
import { Brain } from "lucide-react";
import { getCurrentUser, getClinicByOwner, getTriagesByClinic } from "@/lib/queries";
import { format } from "date-fns";

const URGENCY_BADGE: Record<string, string> = {
  RED: "bg-red-100 text-red-800 border border-red-200",
  YELLOW: "bg-amber-100 text-amber-800 border border-amber-200",
  GREEN: "bg-green-100 text-green-800 border border-green-200",
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-blue-50 text-blue-700",
  REVIEWED: "bg-gray-100 text-gray-600",
  ARCHIVED: "bg-gray-50 text-gray-400",
};

export default async function TriagesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "clinic_admin") redirect("/dashboard");

  const clinic = await getClinicByOwner(user.id);
  if (!clinic) redirect("/settings/clinic");

  const sessions = await getTriagesByClinic(clinic.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="w-6 h-6 text-[#0A9396]" />
        <h1 className="font-syne font-bold text-2xl text-[#003049]">Triage Sessions</h1>
        {sessions.length > 0 && (
          <span className="ml-auto text-sm text-[#56768A]">{sessions.length} total</span>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#CCE8E8] p-16 text-center">
          <Brain className="w-12 h-12 text-[#CCE8E8] mx-auto mb-4" />
          <p className="text-[#56768A] font-semibold text-lg">No triage sessions yet</p>
          <p className="text-xs text-[#56768A] mt-1">
            Sessions will appear here once patients complete AI triage before booking.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#CCE8E8] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F4FAFA] border-b border-[#CCE8E8]">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#56768A] uppercase tracking-wide">Patient</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#56768A] uppercase tracking-wide">Urgency</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#56768A] uppercase tracking-wide">Specialty</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#56768A] uppercase tracking-wide">Main Symptom</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#56768A] uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#56768A] uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CCE8E8]">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-[#F4FAFA] transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-[#003049]">{session.patientName}</p>
                    <p className="text-xs text-[#56768A]">{session.patientEmail}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    {session.urgency ? (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${URGENCY_BADGE[session.urgency]}`}>
                        {session.urgency}
                      </span>
                    ) : (
                      <span className="text-[#56768A]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-[#003049] capitalize">
                    {session.suggestedSpecialty?.replace(/_/g, " ") ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[#56768A] max-w-[200px] truncate">
                    {session.mainSymptom ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[session.status]}`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[#56768A] text-xs">
                    {format(new Date(session.createdAt), "MMM d, yyyy")}
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
