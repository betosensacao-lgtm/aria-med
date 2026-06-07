import { redirect } from "next/navigation";
import { getCurrentUser, getClinicByOwner } from "@/lib/queries";
import { ClinicForm } from "./ClinicForm";

export default async function ClinicSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "clinic_admin") redirect("/dashboard");

  const clinic = await getClinicByOwner(user.id);

  return (
    <div className="bg-white rounded-2xl border border-[#CCE8E8] shadow-card p-8">
      <div className="mb-6">
        <h2 className="font-syne font-bold text-xl text-[#003049]">
          {clinic ? "Edit Clinic" : "Create Your Clinic"}
        </h2>
        <p className="text-sm text-[#56768A] mt-1">
          {clinic
            ? "Update your clinic's public profile and contact details."
            : "Set up your clinic to start receiving appointments."}
        </p>
      </div>
      <ClinicForm defaultValues={clinic ?? undefined} />
    </div>
  );
}
