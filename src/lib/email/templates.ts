// Email HTML templates — all styles inlined (email clients strip <style> and external CSS).
// Brand: navy #003049, teal #0A9396, sky #E0F4F4, off-white #F4FAFA, muted #56768A.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type AppointmentEmailData = {
  patientName: string;
  clinicName: string;
  professionalName: string;
  professionalSpecialty: string;
  date: string;       // human-readable, e.g. "Monday, June 02, 2026"
  startTime: string;  // "9:00 AM"
  endTime: string;    // "9:30 AM"
};

// ─── Shared layout ────────────────────────────────────────────────────────────

function layout(opts: { heading: string; accent?: string; body: string }): string {
  const accent = opts.accent ?? "#0A9396";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F4FAFA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4FAFA;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #CCE8E8;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#003049 0%,#055870 100%);padding:28px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="background-color:${accent};width:36px;height:36px;border-radius:9px;text-align:center;vertical-align:middle;font-size:18px;">📅</td>
            <td style="padding-left:12px;color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.3px;">MedBook</td>
          </tr></table>
        </td></tr>
        <!-- Accent bar -->
        <tr><td style="height:4px;background-color:${accent};"></td></tr>
        <!-- Heading -->
        <tr><td style="padding:32px 32px 0 32px;">
          <h1 style="margin:0;color:#003049;font-size:22px;font-weight:800;letter-spacing:-0.4px;">${opts.heading}</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:16px 32px 32px 32px;color:#56768A;font-size:15px;line-height:1.6;">
          ${opts.body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 32px;background-color:#F4FAFA;border-top:1px solid #CCE8E8;">
          <p style="margin:0;color:#8FA8B5;font-size:12px;line-height:1.5;">
            This is an automated message from MedBook. Please do not reply directly to this email.
          </p>
        </td></tr>
      </table>
      <p style="color:#8FA8B5;font-size:12px;margin-top:16px;">© 2026 MedBook</p>
    </td></tr>
  </table>
</body>
</html>`;
}

// Reusable appointment summary card
function summaryCard(d: AppointmentEmailData): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4FAFA;border:1px solid #CCE8E8;border-radius:12px;margin:20px 0;">
    <tr><td style="padding:20px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding-bottom:12px;">
          <div style="color:#0A9396;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Clinic</div>
          <div style="color:#003049;font-size:15px;font-weight:600;margin-top:2px;">${d.clinicName}</div>
        </td></tr>
        <tr><td style="padding-bottom:12px;border-top:1px solid #E0F4F4;padding-top:12px;">
          <div style="color:#0A9396;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Professional</div>
          <div style="color:#003049;font-size:15px;font-weight:600;margin-top:2px;">${d.professionalName}</div>
          <div style="color:#56768A;font-size:13px;">${d.professionalSpecialty}</div>
        </td></tr>
        <tr><td style="border-top:1px solid #E0F4F4;padding-top:12px;">
          <div style="color:#0A9396;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Date &amp; Time</div>
          <div style="color:#003049;font-size:15px;font-weight:600;margin-top:2px;">${d.date}</div>
          <div style="color:#003049;font-size:15px;">${d.startTime} – ${d.endTime}</div>
        </td></tr>
      </table>
    </td></tr>
  </table>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0;"><tr>
    <td style="background-color:#0A9396;border-radius:10px;">
      <a href="${href}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">${label}</a>
    </td></tr></table>`;
}

// ─── 1. Patient: booking confirmation ─────────────────────────────────────────

export function patientConfirmationEmail(d: AppointmentEmailData & { appointmentId: string }) {
  return {
    subject: `Appointment confirmed at ${d.clinicName}`,
    html: layout({
      heading: "Your appointment is booked! 🎉",
      body: `
        <p style="margin:0 0 8px;">Hi ${d.patientName},</p>
        <p style="margin:0 0 8px;">Great news — your appointment request has been received. The clinic will confirm it shortly. Here are your details:</p>
        ${summaryCard(d)}
        <p style="margin:0 0 16px;">To help your provider prepare, please complete your pre-screening form before your visit:</p>
        ${button(`${APP_URL}/pre-anamnesis/${d.appointmentId}`, "Complete Pre-Screening")}
        <p style="margin:16px 0 0;font-size:13px;color:#8FA8B5;">Need to reschedule? Visit your dashboard to manage this appointment.</p>
      `,
    }),
  };
}

// ─── 2. Clinic admin: new appointment ─────────────────────────────────────────

export function clinicNotificationEmail(d: AppointmentEmailData) {
  return {
    subject: `New appointment request — ${d.patientName}`,
    html: layout({
      heading: "New appointment request",
      accent: "#003049",
      body: `
        <p style="margin:0 0 8px;">A new appointment has been requested at <strong style="color:#003049;">${d.clinicName}</strong>.</p>
        <p style="margin:0 0 8px;"><strong style="color:#003049;">Patient:</strong> ${d.patientName}</p>
        ${summaryCard(d)}
        <p style="margin:0 0 16px;">Review and confirm this appointment from your dashboard:</p>
        ${button(`${APP_URL}/appointments`, "View Appointments")}
      `,
    }),
  };
}

// ─── 3. Patient: 24h reminder ─────────────────────────────────────────────────

export function reminderEmail(d: AppointmentEmailData & { appointmentId: string }) {
  return {
    subject: `Reminder: your appointment tomorrow at ${d.clinicName}`,
    html: layout({
      heading: "Your appointment is tomorrow ⏰",
      accent: "#EE9B00",
      body: `
        <p style="margin:0 0 8px;">Hi ${d.patientName},</p>
        <p style="margin:0 0 8px;">This is a friendly reminder about your upcoming appointment:</p>
        ${summaryCard(d)}
        <p style="margin:0 0 16px;">If you haven't completed your pre-screening yet, please do so now:</p>
        ${button(`${APP_URL}/pre-anamnesis/${d.appointmentId}`, "Complete Pre-Screening")}
        <p style="margin:16px 0 0;font-size:13px;color:#8FA8B5;">Can't make it? Please contact the clinic as soon as possible to reschedule.</p>
      `,
    }),
  };
}
