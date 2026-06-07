"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDays, format } from "date-fns";
import { Calendar, Clock, Loader2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSlotsForProfessional, createAppointment } from "../actions";

type Professional = {
  id: string;
  name: string;
  specialty: string;
  registrationNumber: string | null;
  bio: string | null;
  rating: number;
  reviewCount: number;
};

type Slot = { time: string; available: boolean };

export function BookingWidget({
  clinicId,
  clinicSlug,
  professionals,
}: {
  clinicId: string;
  clinicSlug: string;
  professionals: Professional[];
}) {
  const router = useRouter();
  const [proId, setProId] = useState(professionals[0]?.id ?? "");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [triageSessionId, setTriageSessionId] = useState<string | null>(null);

  useEffect(() => {
    const id = sessionStorage.getItem("triageSessionId");
    if (id) setTriageSessionId(id);
  }, []);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState("");
  const [isBooking, startBooking] = useTransition();

  // 14-day horizon for date selection
  const dateOptions = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  // Fetch slots whenever professional or date changes
  useEffect(() => {
    if (!proId) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    getSlotsForProfessional(proId, date)
      .then(setSlots)
      .finally(() => setLoadingSlots(false));
  }, [proId, date]);

  function handleConfirm() {
    if (!selectedSlot) return;
    setError("");
    startBooking(async () => {
      const result = await createAppointment({
        clinicId,
        professionalId: proId,
        date,
        startTime: selectedSlot,
        ...(triageSessionId ? { triageSessionId } : {}),
      });
      if (result.ok) sessionStorage.removeItem("triageSessionId");

      if (result.ok) {
        router.push(`/booking/${clinicSlug}/confirmed?appt=${result.appointmentId}`);
      } else if (result.needsAuth) {
        const returnTo = encodeURIComponent(`/booking/${clinicSlug}`);
        router.push(`/auth/login?next=${returnTo}`);
      } else {
        setError(result.error);
        // refresh slots in case of a conflict
        getSlotsForProfessional(proId, date).then(setSlots);
      }
    });
  }

  const availableCount = slots.filter((s) => s.available).length;

  return (
    <div className="bg-white rounded-2xl border border-[#CCE8E8] shadow-card p-6 space-y-6">
      <h2 className="font-syne font-bold text-xl text-[#003049]">Book an appointment</h2>

      {/* Step 1: Professional */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">
          1. Choose a professional
        </label>
        <div className="space-y-2">
          {professionals.map((p) => (
            <button
              key={p.id}
              onClick={() => setProId(p.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                proId === p.id
                  ? "border-[#0A9396] bg-[#E0F4F4]"
                  : "border-[#CCE8E8] bg-white hover:border-[#0A9396]/50"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A9396] to-[#003049] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-[#003049] truncate">{p.name}</p>
                <p className="text-xs text-[#56768A] truncate">{p.specialty}</p>
              </div>
              {proId === p.id && <Check className="w-4 h-4 text-[#0A9396] ml-auto flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Date */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" /> 2. Pick a date
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {dateOptions.map((d) => {
            const ds = format(d, "yyyy-MM-dd");
            const active = ds === date;
            return (
              <button
                key={ds}
                onClick={() => setDate(ds)}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[60px] py-2.5 rounded-xl border-2 transition-all flex-shrink-0",
                  active
                    ? "border-[#0A9396] bg-[#0A9396] text-white"
                    : "border-[#CCE8E8] bg-white text-[#003049] hover:border-[#0A9396]/50"
                )}
              >
                <span className={cn("text-[10px] font-semibold uppercase", active ? "text-white/80" : "text-[#56768A]")}>
                  {format(d, "EEE")}
                </span>
                <span className="font-syne font-bold text-lg">{format(d, "d")}</span>
                <span className={cn("text-[10px]", active ? "text-white/80" : "text-[#56768A]")}>
                  {format(d, "MMM")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3: Slots */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> 3. Select a time
        </label>

        {loadingSlots ? (
          <div className="flex items-center justify-center py-8 text-[#56768A]">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-8 px-4 bg-[#F4FAFA] rounded-xl">
            <p className="text-sm text-[#56768A] font-medium">No availability on this day</p>
            <p className="text-xs text-[#56768A] mt-1">This professional doesn't work on the selected date. Try another day.</p>
          </div>
        ) : availableCount === 0 ? (
          <div className="text-center py-8 px-4 bg-[#F4FAFA] rounded-xl">
            <p className="text-sm text-[#56768A] font-medium">Fully booked</p>
            <p className="text-xs text-[#56768A] mt-1">All slots are taken on this day. Try another date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {slots.map((s) => (
              <button
                key={s.time}
                disabled={!s.available}
                onClick={() => setSelectedSlot(s.time)}
                className={cn(
                  "py-2 rounded-lg text-sm font-semibold transition-all",
                  !s.available
                    ? "bg-[#F4FAFA] text-[#CCE8E8] line-through cursor-not-allowed"
                    : selectedSlot === s.time
                    ? "bg-[#0A9396] text-white"
                    : "bg-white border border-[#CCE8E8] text-[#003049] hover:border-[#0A9396]"
                )}
              >
                {s.time}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={!selectedSlot || isBooking}
        className="btn-teal w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isBooking ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</>
        ) : selectedSlot ? (
          <>Confirm {selectedSlot} appointment</>
        ) : (
          <>Select a time to continue</>
        )}
      </button>
    </div>
  );
}
