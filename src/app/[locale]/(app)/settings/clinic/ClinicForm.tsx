"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { saveClinic } from "../actions";

const SPECIALTIES = [
  { value: "general_practice", label: "General Practice" },
  { value: "dentistry",        label: "Dentistry" },
  { value: "aesthetics",       label: "Aesthetics" },
  { value: "cardiology",       label: "Cardiology" },
  { value: "dermatology",      label: "Dermatology" },
  { value: "neurology",        label: "Neurology" },
  { value: "orthopedics",      label: "Orthopedics" },
  { value: "ophthalmology",    label: "Ophthalmology" },
  { value: "gynecology",       label: "Gynecology" },
  { value: "pediatrics",       label: "Pediatrics" },
  { value: "psychiatry",       label: "Psychiatry" },
  { value: "other",            label: "Other" },
];

const schema = z.object({
  name:        z.string().min(2, "Name is required"),
  specialty:   z.string().min(1, "Specialty is required"),
  description: z.string().optional(),
  phone:       z.string().min(6, "Phone is required"),
  email:       z.string().email("Invalid email"),
  street:      z.string().optional(),
  city:        z.string().optional(),
  state:       z.string().optional(),
  zipCode:     z.string().optional(),
  country:     z.string().default("US"),
});
type FormData = z.infer<typeof schema>;

type DefaultValues = {
  name?: string;
  specialty?: string;
  description?: string | null;
  phone?: string;
  email?: string;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
};

export function ClinicForm({ defaultValues }: { defaultValues?: DefaultValues }) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:        defaultValues?.name        ?? "",
      specialty:   defaultValues?.specialty   ?? "",
      description: defaultValues?.description ?? "",
      phone:       defaultValues?.phone       ?? "",
      email:       defaultValues?.email       ?? "",
      street:      defaultValues?.street      ?? "",
      city:        defaultValues?.city        ?? "",
      state:       defaultValues?.state       ?? "",
      zipCode:     defaultValues?.zipCode     ?? "",
      country:     defaultValues?.country     ?? "US",
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const result = await saveClinic(data);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error);
    }
    // On success the action redirects to /dashboard
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic info */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-[#56768A] uppercase tracking-widest">Basic Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Clinic Name *</label>
            <input {...register("name")} className="input-brand" placeholder="Bright Smile Dental" />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Specialty *</label>
            <select {...register("specialty")} className="input-brand">
              <option value="">Select specialty...</option>
              {SPECIALTIES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {errors.specialty && <p className="text-red-500 text-xs">{errors.specialty.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Phone *</label>
            <input {...register("phone")} className="input-brand" placeholder="+1 555 0100" />
            {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Email *</label>
            <input {...register("email")} type="email" className="input-brand" placeholder="info@yourclinic.com" />
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Description</label>
            <textarea
              {...register("description")}
              className="input-brand min-h-[80px] resize-none"
              placeholder="Briefly describe your clinic's specialties and approach..."
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4 pt-2 border-t border-[#CCE8E8]">
        <h3 className="text-xs font-bold text-[#56768A] uppercase tracking-widest mt-4">Address (optional)</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Street</label>
            <input {...register("street")} className="input-brand" placeholder="123 Main Street" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">City</label>
            <input {...register("city")} className="input-brand" placeholder="San Francisco" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">State</label>
            <input {...register("state")} className="input-brand" placeholder="CA" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">ZIP Code</label>
            <input {...register("zipCode")} className="input-brand" placeholder="94102" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Country</label>
            <input {...register("country")} className="input-brand" placeholder="US" />
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button type="submit" disabled={loading} className="btn-teal flex items-center gap-2 disabled:opacity-60">
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : defaultValues ? "Save Changes" : "Create Clinic"}
        </button>
      </div>
    </form>
  );
}
