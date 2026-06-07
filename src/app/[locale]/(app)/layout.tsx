import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { getCurrentUser } from "@/lib/queries";

// Shared layout for all authenticated in-app pages (dashboard, appointments,
// patients, settings). Provides the role-aware sidebar around the content.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");

  return (
    <div className="flex min-h-screen bg-[#F4FAFA]">
      <Sidebar role={user.role} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
