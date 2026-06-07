"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

type Role = "user" | "assistant";
interface Message { role: Role; content: string; }
type TriagePhase = "intake" | "chat" | "complete";

interface TriageResult {
  sessionId: string;
  urgency: "RED" | "YELLOW" | "GREEN";
  suggestedSpecialty: string;
  summary: string;
}

const URGENCY_CLASSES: Record<string, string> = {
  RED: "bg-red-100 text-red-800 border border-red-200",
  YELLOW: "bg-amber-100 text-amber-800 border border-amber-200",
  GREEN: "bg-green-100 text-green-800 border border-green-200",
};

const URGENCY_BG: Record<string, string> = {
  RED: "from-red-50 to-white",
  YELLOW: "from-amber-50 to-white",
  GREEN: "from-green-50 to-white",
};

export default function TriagePage() {
  const t = useTranslations("triage");
  const locale = useLocale();
  const router = useRouter();
  const [phase, setPhase] = useState<TriagePhase>("intake");
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleIntake(e: FormEvent) {
    e.preventDefault();
    if (!patientName.trim() || !patientEmail.trim()) return;
    setPhase("chat");
    const openingMsg = locale === "pt"
      ? "Olá, gostaria de iniciar minha triagem pré-consulta."
      : "Hello, I'd like to start my pre-consultation triage.";
    await sendMessage(openingMsg, []);
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput("");
    await sendMessage(text, messages);
  }

  async function sendMessage(text: string, history: Message[]) {
    const userMessage: Message = { role: "user", content: text };
    const updatedHistory = [...history, userMessage];
    setMessages(updatedHistory);
    setIsLoading(true);

    try {
      const res = await fetch("/api/triage/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientName, patientEmail, message: text, history, locale }),
      });

      if (!res.ok || !res.body) throw new Error("Failed to reach triage API");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      let triageComplete = false;

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const raw = line.replace("data: ", "").trim();
          if (raw === "[DONE]") break;
          try {
            const event = JSON.parse(raw);
            if (event.text) {
              assistantText += event.text;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "assistant", content: assistantText };
                return next;
              });
            }
            if (event.done && event.hasJson) triageComplete = true;
            if (event.error) throw new Error(event.error);
          } catch { /* skip malformed SSE lines */ }
        }
      }

      const finalHistory = [...updatedHistory, { role: "assistant" as Role, content: assistantText }];
      if (triageComplete) await completeSession(finalHistory);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connection error. Please retry.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  async function completeSession(finalHistory: Message[]) {
    const fullConversation = finalHistory
      .map((m) => `${m.role === "user" ? "Patient" : "MedBook AI"}: ${m.content}`)
      .join("\n\n");

    try {
      const res = await fetch("/api/triage/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName,
          patientEmail,
          fullConversation,
          messageCount: finalHistory.filter((m) => m.role === "user").length,
          locale,
        }),
      });
      if (!res.ok) throw new Error("Failed to save triage session");
      const data: TriageResult = await res.json();
      setResult(data);
      setPhase("complete");
    } catch (err) {
      toast.error("Could not save your triage. Your conversation is preserved.");
      console.error(err);
    }
  }

  function handleBookAppointment() {
    if (!result) return;
    sessionStorage.setItem("triageSessionId", result.sessionId);
    sessionStorage.setItem("triageSpecialty", result.suggestedSpecialty);
    const base = locale === "en" ? "/booking" : `/${locale}/booking`;
    router.push(`${base}?specialty=${result.suggestedSpecialty}&from_triage=1`);
  }

  // ── Intake form ──────────────────────────────────────────────────────────────
  if (phase === "intake") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-border p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">M</span>
            </div>
            <div>
              <h1 className="font-semibold text-foreground">{t("title")}</h1>
              <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>

          <form onSubmit={handleIntake} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">{t("nameLabel")}</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">{t("emailLabel")}</label>
              <input
                type="email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors mt-2"
            >
              {t("startButton")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Triage complete ───────────────────────────────────────────────────────────
  if (phase === "complete" && result) {
    const urgencyTextMap: Record<string, string> = {
      RED: t("urgencyRed"),
      YELLOW: t("urgencyYellow"),
      GREEN: t("urgencyGreen"),
    };

    return (
      <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${URGENCY_BG[result.urgency]} px-4`}>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-border p-8 text-center">
          <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ${URGENCY_CLASSES[result.urgency]}`}>
            {urgencyTextMap[result.urgency]}
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2">{t("triageComplete")}</h2>
          <p className="text-muted-foreground text-sm mb-4">{result.summary}</p>

          <div className="bg-muted rounded-lg px-4 py-3 text-left mb-4">
            <p className="text-xs text-muted-foreground mb-1">{t("suggestedSpecialty")}</p>
            <p className="text-sm font-medium capitalize">{result.suggestedSpecialty.replace("_", " ")}</p>
          </div>

          <div className="bg-muted rounded-lg px-4 py-3 text-left mb-6">
            <p className="text-xs text-muted-foreground mb-1">{t("sessionId")}</p>
            <p className="text-xs font-mono text-foreground">{result.sessionId}</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleBookAppointment}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              {t("bookNow")}
            </button>
            <button
              onClick={() => { setPhase("intake"); setMessages([]); setResult(null); setPatientName(""); setPatientEmail(""); }}
              className="w-full py-3 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              {t("newTriage")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Chat interface ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-xs">M</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">MedBook AI</p>
          <p className="text-xs text-muted-foreground truncate">{patientName}</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Active
        </span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          const displayContent = isUser
            ? msg.content
            : msg.content.replace(/```json[\s\S]*?```/g, "").trim();
          if (!displayContent) return null;
          return (
            <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center mr-2 mt-1 shrink-0">
                  <span className="text-primary-foreground text-xs font-bold">M</span>
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                isUser
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-card border border-border text-foreground rounded-tl-sm"
              }`}>
                {displayContent}
              </div>
            </div>
          );
        })}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-xs font-bold">M</span>
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <span className="inline-flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 bg-white border-t border-border px-4 py-3">
        <form onSubmit={handleSend} className="flex gap-2 max-w-2xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as FormEvent); }
            }}
            placeholder={t("chatPlaceholder")}
            rows={1}
            disabled={isLoading}
            className="flex-1 px-3 py-2.5 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t("send")}
          </button>
        </form>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
