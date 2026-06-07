import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries";
import { SettingsTabs } from "./SettingsTabs";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="font-syne font-extrabold text-3xl text-[#003049] tracking-tight">Settings</h1>
        <p className="text-[#56768A] mt-1 text-sm">
          {user.role === "clinic_admin"
            ? "Manage your account and clinic details"
            : "Manage your account details"}
        </p>
      </div>

      <SettingsTabs role={user.role} />

      {children}
    </div>
  );
}
