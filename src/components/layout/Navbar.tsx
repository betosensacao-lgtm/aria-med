"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/#how", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#specialties", label: "Specialties" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        "flex items-center justify-between px-6 md:px-[6%] h-[68px]",
        "bg-white/90 backdrop-blur-md border-b border-[#CCE8E8]",
        scrolled && "shadow-[0_2px_20px_rgba(0,48,73,0.10)]"
      )}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-lg bg-[#0A9396] flex items-center justify-center shadow-teal">
          <Calendar className="w-4 h-4 text-white" />
        </div>
        <span className="font-syne font-800 text-[1.2rem] tracking-tight text-[#003049] font-extrabold">
          MedBook
        </span>
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium text-[#56768A] hover:text-[#0A9396] transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Desktop CTA */}
      <div className="hidden md:flex items-center gap-3">
        <Link
          href="/auth/login"
          className="text-sm font-semibold text-[#003049] hover:text-[#0A9396] transition-colors"
        >
          Sign in
        </Link>
        <Link href="/booking" className="btn-teal text-sm py-2.5 px-5">
          Book Now
        </Link>
      </div>

      {/* Mobile toggle */}
      <button
        className="md:hidden text-[#003049] p-2"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-[68px] left-0 right-0 bg-white border-b border-[#CCE8E8] shadow-lg md:hidden px-6 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#56768A] hover:text-[#0A9396]"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/auth/login" className="text-sm font-semibold text-[#003049]" onClick={() => setMobileOpen(false)}>
            Sign in
          </Link>
          <Link href="/booking" className="btn-teal text-sm text-center" onClick={() => setMobileOpen(false)}>
            Book Now
          </Link>
        </div>
      )}
    </nav>
  );
}
