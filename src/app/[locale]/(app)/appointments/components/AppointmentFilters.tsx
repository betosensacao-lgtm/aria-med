"use client";

import { useRouter, useSearchParams } from "next/navigation";

const STATUSES = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No show" },
];

export function AppointmentFilters({ total }: { total: number }) {
  const router = useRouter();
  const params = useSearchParams();

  const status = params.get("status") ?? "all";
  const date = params.get("date") ?? "";
  const hasFilters = status !== "all" || !!date;

  function updateFilter(key: string, value: string) {
    const p = new URLSearchParams(params.toString());
    if (value && value !== "all") {
      p.set(key, value);
    } else {
      p.delete(key);
    }
    router.push(`/appointments?${p.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select
        value={status}
        onChange={e => updateFilter("status", e.target.value)}
        className="input-brand py-2 text-sm w-44"
      >
        {STATUSES.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <input
        type="date"
        value={date}
        onChange={e => updateFilter("date", e.target.value)}
        className="input-brand py-2 text-sm w-44"
      />

      {hasFilters && (
        <button
          onClick={() => router.push("/appointments")}
          className="text-sm text-[#56768A] hover:text-[#003049] font-medium transition-colors"
        >
          Clear filters ×
        </button>
      )}

      <span className="text-sm text-[#56768A] ml-auto">
        {total} {total === 1 ? "appointment" : "appointments"}
      </span>
    </div>
  );
}
