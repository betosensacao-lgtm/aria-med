"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Search,
  Settings,
  LogOut,
  Calendar as CalIcon,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/auth/actions";
import type { UserRole } from "@/types";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

const clinicNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/triages", label: "Triages", icon: Brain },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

const patientNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/appointments", label: "My Appointments", icon: Calendar },
  { href: "/triage", label: "AI Triage", icon: Brain },
  { href: "/booking", label: "Find Clinics", icon: Search },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const navItems = role === "patient" ? patientNav : clinicNav;

  return (
    <aside className="w-64 min-h-screen bg-[#003049] flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 h-[68px] border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-[#0A9396] flex items-center justify-center">
          <CalIcon className="w-4 h-4 text-white" />
        </div>
        <span className="font-syne font-extrabold text-white tracking-tight">
          MedBook
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          // "active" matches exact path or nested routes (e.g. /settings/profile)
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-[#0A9396] text-white shadow-teal"
                  : "text-white/50 hover:text-white hover:bg-white/8"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/8 transition-all w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
