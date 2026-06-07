"use client";

import { useState, useTransition } from "react";
import { updateAppointmentStatus } from "../actions";
import { getStatusColor } from "@/lib/utils";

const STATUSES = [
  { value: "pending",   label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show",   label: "No show" },
];

export function StatusSelect({
  appointmentId,
  currentStatus,
}: {
  appointmentId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleChange(newStatus: string) {
    setStatus(newStatus);
    startTransition(() => updateAppointmentStatus(appointmentId, newStatus));
  }

  return (
    <select
      value={status}
      onChange={e => handleChange(e.target.value)}
      disabled={isPending}
      className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize cursor-pointer transition-opacity ${getStatusColor(status)} ${isPending ? "opacity-50" : ""}`}
    >
      {STATUSES.map(s => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  );
}
