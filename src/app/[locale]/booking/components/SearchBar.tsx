"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

const SPECIALTIES = [
  { value: "all", label: "All specialties" },
  { value: "general_practice", label: "General Practice" },
  { value: "dentistry", label: "Dentistry" },
  { value: "aesthetics", label: "Aesthetics" },
  { value: "cardiology", label: "Cardiology" },
  { value: "dermatology", label: "Dermatology" },
  { value: "neurology", label: "Neurology" },
  { value: "orthopedics", label: "Orthopedics" },
  { value: "ophthalmology", label: "Ophthalmology" },
  { value: "gynecology", label: "Gynecology" },
  { value: "pediatrics", label: "Pediatrics" },
  { value: "psychiatry", label: "Psychiatry" },
];

export function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("query") ?? "");
  const specialty = params.get("specialty") ?? "all";

  function apply(next: { query?: string; specialty?: string }) {
    const p = new URLSearchParams(params.toString());
    const q = next.query ?? query;
    const s = next.specialty ?? specialty;
    if (q) p.set("query", q); else p.delete("query");
    if (s && s !== "all") p.set("specialty", s); else p.delete("specialty");
    router.push(`/booking?${p.toString()}`);
  }

  return (
    <div className="bg-white rounded-2xl border border-[#CCE8E8] shadow-card p-3 flex flex-col sm:flex-row gap-3">
      <form
        onSubmit={(e) => { e.preventDefault(); apply({}); }}
        className="flex-1 flex items-center gap-2 px-3"
      >
        <Search className="w-5 h-5 text-[#56768A] flex-shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clinics by name..."
          className="w-full py-3 bg-transparent text-sm text-[#0D1B2A] focus:outline-none"
        />
      </form>

      <select
        value={specialty}
        onChange={(e) => apply({ specialty: e.target.value })}
        className="input-brand sm:w-56 py-3"
      >
        {SPECIALTIES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <button onClick={() => apply({})} className="btn-teal text-sm whitespace-nowrap">
        Search
      </button>
    </div>
  );
}
