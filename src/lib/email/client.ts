import { Resend } from "resend";

// Lazy singleton — avoids instantiating at build time when the key may be absent.
let resend: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === "re_your_key") return null; // not configured
  if (!resend) resend = new Resend(key);
  return resend;
}

const FROM = process.env.EMAIL_FROM ?? "MedBook <onboarding@resend.dev>";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export type SendResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Sends an email via Resend. NEVER throws — email delivery is best-effort and
 * must not break the booking flow. Failures are logged and returned as values.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<SendResult> {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not configured — skipping email to", to);
    return { ok: false, error: "Email not configured" };
  }

  try {
    const { data, error } = await client.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error("[email] Resend error:", error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data!.id };
  } catch (e: any) {
    console.error("[email] Unexpected error:", e?.message);
    return { ok: false, error: e?.message ?? "Unknown email error" };
  }
}
