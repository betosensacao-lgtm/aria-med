import Link from "next/link";
import { Star, MapPin, BadgeCheck } from "lucide-react";
import { getSpecialtyLabel, getSpecialtyEmoji } from "@/lib/utils";

type Clinic = {
  id: string;
  name: string;
  slug: string;
  specialty: string;
  description: string | null;
  city: string | null;
  state: string | null;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
};

export function ClinicCard({ clinic }: { clinic: Clinic }) {
  return (
    <Link href={`/booking/${clinic.slug}`} className="card-brand p-6 flex flex-col group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E0F4F4] to-[#F4FAFA] flex items-center justify-center text-2xl">
          {getSpecialtyEmoji(clinic.specialty)}
        </div>
        <div className="flex items-center gap-1 bg-[#F4FAFA] px-2.5 py-1 rounded-full">
          <Star className="w-3.5 h-3.5 fill-[#EE9B00] text-[#EE9B00]" />
          <span className="text-sm font-bold text-[#003049]">{clinic.rating.toFixed(1)}</span>
          <span className="text-xs text-[#56768A]">({clinic.reviewCount})</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-1">
        <h3 className="font-syne font-bold text-lg text-[#003049] group-hover:text-[#0A9396] transition-colors">
          {clinic.name}
        </h3>
        {clinic.isVerified && <BadgeCheck className="w-4 h-4 text-[#0A9396]" />}
      </div>

      <p className="text-xs font-semibold text-[#0A9396] uppercase tracking-wide mb-2">
        {getSpecialtyLabel(clinic.specialty)}
      </p>

      <p className="text-sm text-[#56768A] line-clamp-2 flex-1">{clinic.description}</p>

      {(clinic.city || clinic.state) && (
        <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-[#CCE8E8]">
          <MapPin className="w-3.5 h-3.5 text-[#56768A]" />
          <span className="text-xs text-[#56768A]">
            {[clinic.city, clinic.state].filter(Boolean).join(", ")}
          </span>
        </div>
      )}
    </Link>
  );
}
