"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s cubic-bezier(.22,1,.36,1) ${delay}s, transform 0.7s cubic-bezier(.22,1,.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

const NAV_LINKS = [
  { label: "Funcionalidades", href: "#features" },
  { label: "Planos", href: "#pricing" },
  { label: "Depoimentos", href: "#testimonials" },
];

const FEATURES = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: "Chat Inteligente com IA",
    description:
      "Atenda seus pacientes 24h com um assistente virtual que entende português, tira dúvidas e agenda consultas automaticamente.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Google Calendar Integrado",
    description:
      "Sincronize agenda em tempo real. Seus pacientes agendam direto no Google Calendar, sem conflitos ou.dupla marcação.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: "Gestão de Pacientes",
    description:
      "Histórico completo, prontuários digitais e acompanhamento de tratamentos em um só lugar. Dados seguros e organizados.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "R$ 97",
    period: "/mês",
    description: "Ideal para clínicas pequenas começando com atendimento digital.",
    features: [
      "1 profissional",
      "Chat IA com respostas básicas",
      "Agendamento via Google Calendar",
      "Até 100 pacientes/mês",
      "Suporte por e-mail",
    ],
    cta: "Começar Agora",
    highlighted: false,
  },
  {
    name: "Profissional",
    price: "R$ 197",
    period: "/mês",
    description: "Para clínicas em crescimento que querem escalar o atendimento.",
    features: [
      "Até 5 profissionais",
      "Chat IA avançado com personalização",
      "Agendamento + lembretes automáticos",
      "Pacientes ilimitados",
      "Relatórios e métricas",
      "Suporte prioritário via WhatsApp",
    ],
    cta: "Testar 14 Dias Grátis",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "R$ 397",
    period: "/mês",
    description: "Solução completa para redes e clínicas de grande porte.",
    features: [
      "Profissionais ilimitados",
      "IA treinada com base da clínica",
      "Multi-unidade",
      "Integração com sistemasExternos",
      "API disponível",
      "Suporte dedicado + SLA",
    ],
    cta: "Falar com Vendas",
    highlighted: false,
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Reduzimos 60% das ligações para recepção desde que implementamos o chat. Os pacientes adoram poder agendar sozinhos, e nossa equipe pode focar no que realmente importa.",
    name: "Dra. Camila Ferreira",
    role: "Clínica Vida Saudável — São Paulo, SP",
    avatar: "CF",
  },
  {
    quote:
      "O agendamento automático pelo Google Calendar eliminou os conflitos de agenda que tínhamos toda semana. Economizamos pelo menos 2 horas por dia da recepcionista.",
    name: "Dr. Ricardo Mendes",
    role: "Instituto Ortopédico Rio — Rio de Janeiro, RJ",
    avatar: "RM",
  },
  {
    quote:
      "Nossos pacientes elogiam o atendimento 24h. O chat responde dúvidas comuns na hora, e só encaminha para a gente quando realmente precisa. Transformou nossa clínica.",
    name: "Dra. Beatriz Almeida",
    role: "Odonto Prime — Belo Horizonte, MG",
    avatar: "BA",
  },
];

export default function MarketingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4FAFA] font-dm overflow-x-hidden">
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl gradient-teal flex items-center justify-center shadow-teal transition-transform group-hover:scale-105">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="font-syne font-bold text-xl text-[#003049] tracking-tight">
                Med<span className="text-[#0A9396]">Book</span>
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-sm font-medium text-[#56768A] hover:text-[#0A9396] transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <a href="#pricing" className="btn-teal text-sm !px-5 !py-2.5">
                Comece Grátis
              </a>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#003049]"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass border-t border-[#CCE8E8]/60 px-4 pb-4 pt-2">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-sm font-medium text-[#56768A] hover:text-[#0A9396] transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a href="#pricing" className="btn-teal text-sm mt-2 block text-center">
              Comece Grátis
            </a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-20 -left-32 w-96 h-96 bg-[#0A9396]/10 rounded-full blur-3xl" />
        <div className="absolute top-40 -right-32 w-80 h-80 bg-[#003049]/8 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — copy */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-[#E0F4F4] text-[#0A9396] text-xs font-semibold tracking-wide uppercase px-3.5 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A9396] animate-pulse" />
                Plataforma #1 para clínicas digitais
              </div>

              <h1 className="font-syne font-extrabold text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.1] text-[#003049] text-balance mb-6">
                Sua clínica{" "}
                <span className="text-[#0A9396]">atendendo 24h</span>{" "}
                com inteligência artificial
              </h1>

              <p className="text-lg text-[#56768A] leading-relaxed mb-8 max-w-lg">
                Chatbot que agenda consultas, tira dúvidas dos pacientes e integra
                direto com o Google Calendar. Sem complicação, sem perder tempo.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <a href="#pricing" className="btn-teal text-base text-center">
                  Testar 14 Dias Grátis
                </a>
                <a href="#features" className="btn-outline-teal text-base text-center">
                  Ver Funcionalidades
                </a>
              </div>

              <p className="text-xs text-[#56768A]/70 mt-5">
                Sem cartão de crédito. Cancele quando quiser.
              </p>
            </div>

            {/* Right — animated chat widget preview */}
            <FadeIn delay={0.3} className="relative mx-auto lg:mx-0 w-full max-w-md">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0A9396]/20 to-[#003049]/10 rounded-3xl blur-2xl scale-105" />
              <div className="relative bg-white rounded-3xl shadow-[0_8px_60px_rgba(10,147,150,0.18)] border border-[#CCE8E8]/50 overflow-hidden">
                {/* Chat header */}
                <div className="gradient-teal px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-syne font-semibold text-sm">MedBook Assistente</p>
                    <p className="text-[#94D2BD] text-xs">Online agora</p>
                  </div>
                </div>

                {/* Chat messages */}
                <div className="p-5 space-y-4 min-h-[280px]">
                  <ChatBubble
                    sender="bot"
                    text="Olá! 👋 Sou a assistente virtual da Clínica Saúde+. Como posso ajudar?"
                    delay={0.6}
                  />
                  <ChatBubble
                    sender="user"
                    text="Quero agendar uma consulta com o Dr. Ricardo."
                    delay={1.8}
                  />
                  <ChatBubble
                    sender="bot"
                    text="Claro! O Dr. Ricardo tem disponibilidade na quarta às 14h ou na quinta às 10h. Qual fica melhor para você?"
                    delay={3.0}
                  />
                </div>

                {/* Chat input */}
                <div className="px-5 pb-5">
                  <div className="flex items-center gap-2 bg-[#F4FAFA] rounded-xl border border-[#CCE8E8]/60 px-4 py-3">
                    <span className="text-sm text-[#56768A]/50 flex-1">Digite sua mensagem...</span>
                    <div className="w-8 h-8 rounded-lg gradient-teal flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── LOGO BAR ── */}
      <section className="py-10 border-y border-[#CCE8E8]/40 bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-[#56768A]/60 uppercase tracking-widest font-semibold mb-6">
            Clínicas que confiam no MedBook
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-[#003049]/25 font-syne font-bold text-lg">
            {["Vida Saudável", "Ortopédico Rio", "Odonto Prime", "Clínica Bem Estar", "Saúde+"].map(
              (name) => (
                <span key={name} className="hover:text-[#0A9396]/40 transition-colors duration-300">
                  {name}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-center text-xs text-[#0A9396] uppercase tracking-widest font-semibold mb-3">
              Funcionalidades
            </p>
            <h2 className="font-syne font-bold text-3xl sm:text-4xl text-[#003049] text-center text-balance mb-4">
              Tudo que sua clínica precisa,{" "}
              <span className="text-[#0A9396]">em um só lugar</span>
            </h2>
            <p className="text-[#56768A] text-center max-w-2xl mx-auto mb-16">
              Reduza a burocracia, automatize o atendimento e foque no que realmente importa: seus pacientes.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.12}>
                <div className="card-brand p-7 sm:p-8 h-full group">
                  <div className="w-14 h-14 rounded-2xl bg-[#E0F4F4] text-[#0A9396] flex items-center justify-center mb-5 group-hover:gradient-teal group-hover:text-white transition-all duration-300">
                    {f.icon}
                  </div>
                  <h3 className="font-syne font-bold text-xl text-[#003049] mb-3">
                    {f.title}
                  </h3>
                  <p className="text-[#56768A] text-sm leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-center text-xs text-[#0A9396] uppercase tracking-widest font-semibold mb-3">
              Como funciona
            </p>
            <h2 className="font-syne font-bold text-3xl sm:text-4xl text-[#003049] text-center text-balance mb-16">
              Pronto em{" "}
              <span className="text-[#0A9396]">3 passos simples</span>
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Connector line — desktop only */}
            <div className="hidden md:block absolute top-14 left-[20%] right-[20%] h-px bg-gradient-to-r from-[#0A9396]/30 via-[#0A9396]/60 to-[#0A9396]/30" />

            {[
              {
                step: "01",
                title: "Cadastre sua clínica",
                desc: "Crie sua conta em menos de 2 minutos. Sem papelada, sem espera.",
              },
              {
                step: "02",
                title: "Configure o chat",
                desc: "Personalize as respostas, horários e integre com seu Google Calendar.",
              },
              {
                step: "03",
                title: "Seus pacientes agendam",
                desc: "Compartilhe o link e deixe a IA cuidar do resto. Atendimento 24h.",
              },
            ].map((s, i) => (
              <FadeIn key={s.step} delay={i * 0.15}>
                <div className="text-center relative">
                  <div className="w-20 h-20 rounded-2xl gradient-teal flex items-center justify-center mx-auto mb-6 relative z-10 shadow-teal">
                    <span className="font-syne font-extrabold text-2xl text-white">{s.step}</span>
                  </div>
                  <h3 className="font-syne font-bold text-xl text-[#003049] mb-2">
                    {s.title}
                  </h3>
                  <p className="text-[#56768A] text-sm leading-relaxed max-w-xs mx-auto">
                    {s.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-center text-xs text-[#0A9396] uppercase tracking-widest font-semibold mb-3">
              Planos e preços
            </p>
            <h2 className="font-syne font-bold text-3xl sm:text-4xl text-[#003049] text-center text-balance mb-4">
              Invista no{" "}
              <span className="text-[#0A9396]">futuro da sua clínica</span>
            </h2>
            <p className="text-[#56768A] text-center max-w-xl mx-auto mb-16">
              Sem surpresas. Cancele quando quiser. Teste grátis por 14 dias em qualquer plano.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
            {PLANS.map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 0.12}>
                <div
                  className={`rounded-2xl p-7 sm:p-8 relative ${
                    plan.highlighted
                      ? "bg-[#003049] text-white shadow-[0_12px_50px_rgba(0,48,73,0.25)] scale-[1.02] md:-my-4"
                      : "bg-white border border-[#CCE8E8] shadow-card"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#EE9B00] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full">
                      Mais popular
                    </div>
                  )}

                  <h3
                    className={`font-syne font-bold text-lg mb-1 ${
                      plan.highlighted ? "text-white" : "text-[#003049]"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm mb-5 ${
                      plan.highlighted ? "text-[#94D2BD]" : "text-[#56768A]"
                    }`}
                  >
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="font-syne font-extrabold text-4xl">{plan.price}</span>
                    <span
                      className={`text-sm ${
                        plan.highlighted ? "text-[#94D2BD]" : "text-[#56768A]"
                      }`}
                    >
                      {plan.period}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-sm">
                        <svg
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            plan.highlighted ? "text-[#94D2BD]" : "text-[#0A9396]"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={plan.highlighted ? "text-[#E0F4F4]" : "text-[#56768A]"}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href="#"
                    className={`block text-center font-syne font-bold text-sm py-3.5 rounded-xl transition-all duration-200 active:scale-[0.97] ${
                      plan.highlighted
                        ? "bg-[#0A9396] text-white hover:bg-[#94D2BD] hover:text-[#003049] shadow-teal"
                        : "btn-outline-teal"
                    }`}
                  >
                    {plan.cta}
                  </a>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-center text-xs text-[#0A9396] uppercase tracking-widest font-semibold mb-3">
              Depoimentos
            </p>
            <h2 className="font-syne font-bold text-3xl sm:text-4xl text-[#003049] text-center text-balance mb-16">
              O que nossos clientes{" "}
              <span className="text-[#0A9396]">dizem</span>
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.12}>
                <div className="card-brand p-7 h-full flex flex-col">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <svg
                        key={j}
                        className="w-4 h-4 text-[#EE9B00]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  <blockquote className="text-[#56768A] text-sm leading-relaxed flex-1 mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>

                  <div className="flex items-center gap-3 pt-4 border-t border-[#CCE8E8]/50">
                    <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center text-white text-xs font-syne font-bold">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-syne font-semibold text-sm text-[#003049]">
                        {t.name}
                      </p>
                      <p className="text-xs text-[#56768A]">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="gradient-navy rounded-3xl px-6 sm:px-12 py-14 sm:py-20 text-center relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#0A9396]/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#0A9396]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                <h2 className="font-syne font-bold text-3xl sm:text-4xl text-white text-balance mb-4">
                  Pronto para transformar sua clínica?
                </h2>
                <p className="text-[#94D2BD] max-w-lg mx-auto mb-8">
                  Comece seu teste gratuito de 14 dias. Sem cartão de crédito, sem compromisso.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href="#"
                    className="inline-block bg-[#0A9396] text-white font-syne font-bold text-base px-8 py-4 rounded-xl hover:bg-[#94D2BD] hover:text-[#003049] active:scale-95 transition-all duration-200 shadow-teal"
                  >
                    Começar Teste Grátis
                  </a>
                  <a
                    href="#"
                    className="inline-block bg-transparent text-[#94D2BD] font-syne font-bold text-base px-8 py-4 rounded-xl border-[1.5px] border-[#94D2BD]/40 hover:bg-white/10 active:scale-95 transition-all duration-200"
                  >
                    Falar com Consultor
                  </a>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#003049] text-[#94D2BD] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4 group">
                <div className="w-9 h-9 rounded-xl gradient-teal flex items-center justify-center shadow-teal transition-transform group-hover:scale-105">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="font-syne font-bold text-xl text-white tracking-tight">
                  Med<span className="text-[#0A9396]">Book</span>
                </span>
              </Link>
              <p className="text-sm text-[#94D2BD]/70 leading-relaxed max-w-xs">
                Atendimento inteligente para clínicas modernas. Agende, atenda e gerencie — tudo em uma plataforma.
              </p>
            </div>

            {/* Produto */}
            <div>
              <h4 className="font-syne font-bold text-white text-sm mb-4">Produto</h4>
              <ul className="space-y-2.5 text-sm">
                {["Funcionalidades", "Preços", "Integrações", "API"].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-[#94D2BD]/70 hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h4 className="font-syne font-bold text-white text-sm mb-4">Empresa</h4>
              <ul className="space-y-2.5 text-sm">
                {["Sobre nós", "Blog", "Carreiras", "Contato"].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-[#94D2BD]/70 hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suporte */}
            <div>
              <h4 className="font-syne font-bold text-white text-sm mb-4">Suporte</h4>
              <ul className="space-y-2.5 text-sm">
                {["Central de Ajuda", "Documentação", "Status", "Termos de Uso"].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-[#94D2BD]/70 hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-[#94D2BD]/15 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#94D2BD]/50">
              &copy; {new Date().getFullYear()} MedBook. Todos os direitos reservados.
            </p>
            <div className="flex gap-4">
              {/* Social icons — simple SVG circles */}
              {[
                { label: "Instagram", path: "M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm4.25 5a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm5.25-3.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5z" },
                { label: "LinkedIn", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
                { label: "WhatsApp", path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full bg-[#94D2BD]/10 flex items-center justify-center hover:bg-[#0A9396] text-[#94D2BD]/60 hover:text-white transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── FLOATING CHAT BUTTON ── */}
      <Link
        href="/chat"
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Abrir chat"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#0A9396] animate-ping opacity-20 group-hover:opacity-0" />
          <div className="relative w-14 h-14 rounded-full gradient-teal flex items-center justify-center shadow-[0_4px_24px_rgba(10,147,150,0.4)] group-hover:shadow-[0_6px_32px_rgba(10,147,150,0.55)] group-hover:scale-110 active:scale-95 transition-all duration-200">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ── Chat Bubble sub-component with staggered entry ── */
function ChatBubble({
  sender,
  text,
  delay,
}: {
  sender: "bot" | "user";
  text: string;
  delay: number;
}) {
  const { ref, visible } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`flex ${sender === "user" ? "justify-end" : "justify-start"}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateY(0) scale(1)"
          : "translateY(12px) scale(0.95)",
        transition: `opacity 0.45s cubic-bezier(.22,1,.36,1) ${delay}s, transform 0.45s cubic-bezier(.22,1,.36,1) ${delay}s`,
      }}
    >
      <div
        className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
          sender === "bot"
            ? "bg-[#E0F4F4] text-[#003049] rounded-2xl rounded-bl-md"
            : "gradient-teal text-white rounded-2xl rounded-br-md"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
