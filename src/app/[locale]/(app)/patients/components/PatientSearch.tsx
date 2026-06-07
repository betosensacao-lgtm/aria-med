"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useState } from "react";

export function PatientSearch({ total }: { total: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (query.trim()) p.set("q", query.trim());
    router.push(`/patients?${p.toString()}`);
  }

  function clear() {
    setQuery("");
    router.push("/patients");
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form onSubmit={submit} className="flex items-center gap-2 flex-1 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#56768A]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name..."
            className="input-brand pl-10 py-2"
          />
          {query && (
            <button type="button" onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#56768A] hover:text-[#003049]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button type="submit" className="btn-teal text-sm py-2 px-4">Search</button>
      </form>
      <span className="text-sm text-[#56768A] ml-auto">
        {total} {total === 1 ? "patient" : "patients"}
      </span>
    </div>
  );
}
