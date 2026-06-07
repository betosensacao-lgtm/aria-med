"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const allTabs = [
  { href: "/settings/profile", label: "Profile",  icon: User,      roles: ["patient", "clinic_admin", "professional"] },
  { href: "/settings/clinic",  label: "My Clinic", icon: Building2, roles: ["clinic_admin"] },
];

export function SettingsTabs({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const tabs = allTabs.filter(t => t.roles.includes(role));

  return (
    <div className="flex gap-1 border-b border-[#CCE8E8]">
      {tabs.map(t => {
        const Icon = t.icon;
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
              active
                ? "border-[#0A9396] text-[#0A9396]"
                : "border-transparent text-[#56768A] hover:text-[#003049]"
            )}
          >
            <Icon className="w-4 h-4" /> {t.label}
          </Link>
        );
      })}
    </div>
  );
}
