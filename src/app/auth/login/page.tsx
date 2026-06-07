"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Calendar, Eye, EyeOff, ArrowRight } from "lucide-react";
import { loginAction } from "@/app/auth/actions";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4FAFA]" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? undefined;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setServerError("");
    const result = await loginAction(data, next);
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
            Welcome back to your clinic portal
          </h2>
          <p className="text-white/50 text-lg leading-relaxed">
            Manage appointments, patient records, and pre-screening forms all in one place.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { num: "12k+", label: "Appointments" },
              { num: "840", label: "Providers" },
              { num: "4.9★", label: "Rating" },
              { num: "60%", label: "Less no-shows" },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="font-syne font-extrabold text-2xl text-white">{s.num}</div>
                <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/25 text-sm relative z-10">© 2025 MedBook</p>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F4FAFA]">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="font-syne font-extrabold text-3xl text-[#003049] tracking-tight">Sign in</h1>
            <p className="text-[#56768A] mt-2 text-sm">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-[#0A9396] font-semibold hover:underline">
                Create one
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">
                {serverError}
              </div>
            )}
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
              <div className="flex justify-between">
                <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-[#0A9396] hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className="input-brand pr-11"
                  placeholder="••••••••"
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

            <button
              type="submit"
              disabled={loading}
              className="btn-teal w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? "Signing in..." : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#CCE8E8]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#F4FAFA] px-3 text-[#56768A]">or continue with</span>
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-3 bg-white border border-[#CCE8E8] rounded-xl py-3 text-sm font-semibold text-[#003049] hover:border-[#0A9396] transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
