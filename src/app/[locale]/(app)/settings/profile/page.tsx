import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries";
import { ProfileForm } from "./ProfileForm";

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="bg-white rounded-2xl border border-[#CCE8E8] shadow-card p-8">
      <div className="mb-6">
        <h2 className="font-syne font-bold text-xl text-[#003049]">Personal Information</h2>
        <p className="text-sm text-[#56768A] mt-1">Update your name and contact details</p>
      </div>

      <div className="flex items-center gap-3 p-4 bg-[#F4FAFA] rounded-xl border border-[#CCE8E8] mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0A9396] to-[#003049] flex items-center justify-center text-white font-bold flex-shrink-0">
          {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-[#003049]">{user.name}</p>
          <p className="text-sm text-[#56768A]">{user.email}</p>
        </div>
      </div>

      <ProfileForm defaultValues={{ name: user.name, phone: user.phone ?? "" }} />
    </div>
  );
}
