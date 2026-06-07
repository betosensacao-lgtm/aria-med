import Link from "next/link";
import { Calendar, Mail } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4FAFA] p-8">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0A9396] flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-syne font-extrabold text-3xl text-[#003049]">Check your email</h1>
          <p className="text-[#56768A] text-sm leading-relaxed">
            We sent a confirmation link to your email address.
            Click the link to activate your account and access the dashboard.
          </p>
        </div>

        <div className="bg-white border border-[#CCE8E8] rounded-2xl p-5 text-left space-y-3">
          <p className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">What to do next</p>
          {[
            "Open your email inbox",
            'Click the "Confirm your email" link',
            "You'll be redirected to the dashboard automatically",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#E0F4F4] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-[#0A9396]">{i + 1}</span>
              </div>
              <p className="text-sm text-[#003049]">{step}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#56768A]">
          Didn't receive an email?{" "}
          <Link href="/auth/login" className="text-[#0A9396] font-semibold hover:underline">
            Try signing in
          </Link>{" "}
          or check your spam folder.
        </p>

        <Link href="/" className="flex items-center justify-center gap-2 text-sm text-[#56768A] hover:text-[#003049] transition-colors">
          <Calendar className="w-4 h-4" />
          <span className="font-syne font-bold">MedBook</span>
        </Link>
      </div>
    </div>
  );
}
