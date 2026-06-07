import { Suspense } from "react";
import Link from "next/link";
import { Calendar, SearchX, Brain } from "lucide-react";
import { searchClinics } from "@/lib/booking";
import { ClinicCard } from "./components/ClinicCard";
import { SearchBar } from "./components/SearchBar";

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string; query?: string; from_triage?: string }>;
}) {
  const { specialty, query, from_triage } = await searchParams;
  const clinics = await searchClinics({ specialty, query });
  const fromTriage = from_triage === "1";

  return (
    <div className="min-h-screen bg-[#F4FAFA]">
      {/* Header */}
      <header className="bg-white border-b border-[#CCE8E8]">
        <div className="max-w-6xl mx-auto px-6 h-[68px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0A9396] flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="font-syne font-extrabold text-[#003049] tracking-tight">
              MedBook
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/triage" className="flex items-center gap-1.5 text-sm font-semibold text-[#0A9396] hover:text-[#0A9396]/80">
              <Brain className="w-4 h-4" />
              AI Triage
            </Link>
            <Link href="/auth/login" className="text-sm font-semibold text-[#003049] hover:text-[#0A9396]">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Triage banner */}
        {fromTriage && specialty && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-3.5">
            <Brain className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-sm text-blue-800">
              Based on your triage, we&apos;re showing clinics for{" "}
              <strong className="capitalize">{specialty.replace(/_/g, " ")}</strong>.
            </p>
          </div>
        )}

        {/* Hero */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h1 className="font-syne font-extrabold text-4xl text-[#003049] tracking-tight">
            Find & book your next appointment
          </h1>
          <p className="text-[#56768A]">
            Browse top-rated clinics, check real-time availability, and book in seconds.
          </p>
        </div>

        {/* Search */}
        <Suspense fallback={<div className="h-20 bg-white rounded-2xl border border-[#CCE8E8] animate-pulse" />}>
          <SearchBar />
        </Suspense>

        {/* Results */}
        {clinics.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#CCE8E8] p-16 text-center">
            <SearchX className="w-12 h-12 text-[#CCE8E8] mx-auto mb-4" />
            <p className="text-[#56768A] font-semibold text-lg">No clinics found</p>
            <p className="text-xs text-[#56768A] mt-1">Try a different specialty or search term.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#56768A]">
              {clinics.length} {clinics.length === 1 ? "clinic" : "clinics"} available
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {clinics.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
