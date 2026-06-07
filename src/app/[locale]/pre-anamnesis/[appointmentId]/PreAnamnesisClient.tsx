"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PreAnamnesisForm } from "@/components/anamnesis/PreAnamnesisForm";
import { savePreAnamnesis } from "../actions";
import type { PreAnamnesisInput } from "@/lib/validations";

export function PreAnamnesisClient({
  appointmentId,
  patientName,
}: {
  appointmentId: string;
  patientName?: string;
}) {
  const [error, setError] = useState("");

  async function handleComplete(data: PreAnamnesisInput) {
    const result = await savePreAnamnesis(appointmentId, data);
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success("Pre-screening submitted successfully!");
    }
  }

  return (
    <>
      {error && (
        <div className="max-w-2xl mx-auto mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}
      <PreAnamnesisForm
        appointmentId={appointmentId}
        patientName={patientName}
        onComplete={handleComplete}
      />
    </>
  );
}
