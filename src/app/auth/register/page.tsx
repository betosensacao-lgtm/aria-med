"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { registerAction } from "@/app/auth/actions";
import { Calendar, Eye, EyeOff, ArrowRight, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "patient" },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    setServerError("");
    const result = await registerAction(data);
    if (result?.error) {
      setServerError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-navy flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#0A9396]/10 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#94D2BD]/10 translate-y-1/2 -translate-x-1/4" />

        <Link href="/" className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-[#0A9396] flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="font-syne font-extrabold text-white text-xl tracking-tight">MedBook</span>
        </Link>

        <div className="relative z-10 space-y-6">
          <h2 className="font-syne font-extrabold text-4xl text-white leading-tight">
            Join thousands of clinics and patients
          </h2>
          <p className="text-white/50 text-lg leading-relaxed">
            Create your account in seconds. No credit card required.
          </p>
          <div className="space-y-4 pt-4">
            {[
              { icon: "🏥", title: "For Clinics", desc: "Manage appointments, staff, and patient records in one place." },
              { icon: "🧑‍⚕️", title: "For Patients", desc: "Book appointments 24/7, complete pre-screening online." },
            ].map((item) => (
              <div key={item.title} className="bg-white/5 rounded-xl p-4 border border-white/10 flex gap-4">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{item.title}</p>
                  <p className="text-white/40 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/25 text-sm relative z-10">© 2025 MedBook</p>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F4FAFA] overflow-y-auto">
        <div className="w-full max-w-md space-y-6 py-8">
          <div>
            <h1 className="font-syne font-extrabold text-3xl text-[#003049] tracking-tight">Create account</h1>
            <p className="text-[#56768A] mt-2 text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-[#0A9396] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "patient" as const, label: "I'm a Patient", icon: User, desc: "Book appointments" },
              { value: "clinic_admin" as const, label: "I run a Clinic", icon: Building2, desc: "Manage my clinic" },
            ].map((opt) => {
              const Icon = opt.icon;
              const active = selectedRole === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("role", opt.value)}
                  className={cn(
                    "flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all",
                    active
                      ? "border-[#0A9396] bg-[#E0F4F4]"
                      : "border-[#CCE8E8] bg-white hover:border-[#0A9396]/50"
                  )}
                >
                  <Icon className={cn("w-5 h-5", active ? "text-[#0A9396]" : "text-[#56768A]")} />
                  <span className={cn("text-sm font-semibold", active ? "text-[#003049]" : "text-[#56768A]")}>
                    {opt.label}
                  </span>
                  <span className="text-xs text-[#56768A]">{opt.desc}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">
                {serverError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Full Name</label>
              <input
                {...register("name")}
                type="text"
                className="input-brand"
                placeholder="Jane Smith"
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Email</label>
              <input
                {...register("email")}
                type="email"
                className="input-brand"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className="input-brand pr-11"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#56768A] hover:text-[#003049]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Confirm Password</label>
              <input
                {...register("confirmPassword")}
                type="password"
                className="input-brand"
                placeholder="Repeat your password"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-teal w-full flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {loading ? "Creating account..." : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-xs text-[#56768A] text-center">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="text-[#0A9396] hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-[#0A9396] hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
