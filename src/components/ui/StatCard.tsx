import { forwardRef } from "react";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  variant?: "default" | "highlight";
}

export function StatCard({ label, value, change, icon, variant = "default" }: StatCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-2xl border border-gray-200 shadow-sm p-5",
      variant === "highlight" && "border-teal-200 bg-teal-50/50"
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={cn(
            "text-3xl font-bold mt-1",
            variant === "highlight" ? "text-teal-600" : "text-gray-900"
          )}>
            {value}
          </p>
          {change !== undefined && (
            <p className={cn(
              "text-xs mt-1 font-medium",
              change >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {change >= 0 ? "+" : ""}{change}% vs. ontem
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            "p-3 rounded-xl",
            variant === "highlight" ? "bg-teal-100 text-teal-600" : "bg-gray-100 text-gray-600"
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
