"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { updateProfile } from "../actions";

const schema = z.object({
  name:  z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function ProfileForm({ defaultValues }: { defaultValues: { name: string; phone: string } }) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const result = await updateProfile(data);
    setLoading(false);
    if (result.ok) {
      toast.success("Profile updated!");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Full Name</label>
        <input {...register("name")} className="input-brand" placeholder="Jane Smith" />
        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Phone</label>
        <input {...register("phone")} className="input-brand" placeholder="+1 555 000-0000" />
      </div>

      <div className="pt-2">
        <button type="submit" disabled={loading} className="btn-teal flex items-center gap-2 disabled:opacity-60">
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
