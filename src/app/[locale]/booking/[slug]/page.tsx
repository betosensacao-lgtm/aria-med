import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Star, MapPin, Phone, Mail, BadgeCheck, ArrowLeft, Award } from "lucide-react";
import { getClinicBySlug, getClinicProfessionals } from "@/lib/booking";
import { getSpecialtyLabel, getSpecialtyEmoji } from "@/lib/utils";
import { BookingWidget } from "./BookingWidget";

export default async function ClinicBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const clinic = await getClinicBySlug(slug);
  if (!clinic) notFound();

  const professionals = await getClinicProfessionals(clinic.id);

  return (
    <div className="min-h-screen bg-[#F4FAFA]">
      {/* Header */}
      <header className="bg-white border-b border-[#CCE8E8]">
        <div className="max-w-6xl mx-auto px-6 h-[68px] flex items-center justify-between">
          <Link href="/booking" className="flex items-center gap-2 text-sm font-semibold text-[#56768A] hover:text-[#003049]">
            <ArrowLeft className="w-4 h-4" /> Back to search
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0A9396] flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="font-syne font-extrabold text-[#003049] tracking-tight">MedBook</span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: clinic info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Clinic header */}
          <div className="bg-white rounded-2xl border border-[#CCE8E8] shadow-card p-8">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#E0F4F4] to-[#F4FAFA] flex items-center justify-center text-4xl flex-shrink-0">
                {getSpecialtyEmoji(clinic.specialty)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-syne font-extrabold text-2xl text-[#003049]">{clinic.name}</h1>
                  {clinic.isVerified && <BadgeCheck className="w-5 h-5 text-[#0A9396]" />}
                </div>
                <p className="text-xs font-semibold text-[#0A9396] uppercase tracking-wide mb-3">
                  {getSpecialtyLabel(clinic.specialty)}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-[#EE9B00] text-[#EE9B00]" />
                    <span className="font-bold text-[#003049]">{clinic.rating.toFixed(1)}</span>
                    <span className="text-[#56768A]">({clinic.reviewCount} reviews)</span>
                  </div>
                  {(clinic.city || clinic.state) && (
                    <div className="flex items-center gap-1.5 text-[#56768A]">
                      <MapPin className="w-4 h-4" />
                      {[clinic.city, clinic.state].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {clinic.description && (
              <p className="text-[#56768A] mt-6 leading-relaxed">{clinic.description}</p>
            )}

            <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-[#CCE8E8] text-sm text-[#56768A]">
              <div className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {clinic.phone}</div>
              <div className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {clinic.email}</div>
            </div>
          </div>

          {/* Professionals */}
          <div className="bg-white rounded-2xl border border-[#CCE8E8] shadow-card p-8">
            <h2 className="font-syne font-bold text-xl text-[#003049] mb-5">Our Professionals</h2>
            <div className="space-y-4">
              {professionals.map((p) => (
                <div key={p.id} className="flex items-start gap-4 pb-4 border-b border-[#CCE8E8] last:border-0 last:pb-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0A9396] to-[#003049] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#003049]">{p.name}</p>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 fill-[#EE9B00] text-[#EE9B00]" />
                        <span className="font-bold text-[#003049]">{p.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-[#0A9396] font-medium">{p.specialty}</p>
                    {p.registrationNumber && (
                      <p className="text-xs text-[#56768A] flex items-center gap-1 mt-0.5">
                        <Award className="w-3 h-3" /> {p.registrationNumber}
                      </p>
                    )}
                    {p.bio && <p className="text-sm text-[#56768A] mt-2">{p.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: booking widget (sticky) */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-10">
            {professionals.length > 0 ? (
              <BookingWidget
                clinicId={clinic.id}
                clinicSlug={clinic.slug}
                professionals={professionals}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-[#CCE8E8] p-8 text-center">
                <p className="text-[#56768A] text-sm">No professionals available for booking yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
