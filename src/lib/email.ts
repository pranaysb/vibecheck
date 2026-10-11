/**
 * Transactional email. Providers, in order of preference:
 * 1. Gmail SMTP (GMAIL_USER + GMAIL_APP_PASSWORD): no domain needed; sent by Google, so it passes Gmail's SPF/DKIM.
 * 2. Resend (RESEND_API_KEY + EMAIL_FROM): needs a domain verified in Resend.
 * 3. Neither: development prints the email to the console; production refuses.
 */
import nodemailer, { type Transporter } from "nodemailer";

export class EmailNotConfiguredError extends Error {}

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

let gmail: Transporter | null = null;

async function sendViaGmail(user: string, pass: string, msg: OutgoingEmail) {
  gmail ??= nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: pass.replace(/\s+/g, "") }, // Google shows app passwords with spaces
    connectionTimeout: 10_000,
    socketTimeout: 15_000,
  });
  // Gmail rewrites From to the authenticated account, so only the display name is configurable.
  const from = { name: process.env.EMAIL_FROM_NAME || "VibeCheck", address: user };
  try {
    await gmail.sendMail({ from, to: msg.to, subject: msg.subject, text: msg.text, html: msg.html });
  } catch (err) {
    gmail = null;
    console.error(`Gmail SMTP send failed: ${(err as Error).message}`);
    throw new Error("We couldn't send the email. Try again in a minute.");
  }
}

async function sendViaResend(key: string, from: string, msg: OutgoingEmail) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, text: msg.text, html: msg.html }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`Resend rejected email (${res.status}): ${detail.slice(0, 300)}`);
    throw new Error("We couldn't send the email. Try again in a minute.");
  }
}

export function emailProvider(): "gmail" | "resend" | null {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) return "gmail";
  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) return "resend";
  return null;
}

export async function sendEmail(msg: OutgoingEmail): Promise<void> {
  const provider = emailProvider();
  if (provider === "gmail") return sendViaGmail(process.env.GMAIL_USER!, process.env.GMAIL_APP_PASSWORD!, msg);
  if (provider === "resend") return sendViaResend(process.env.RESEND_API_KEY!, process.env.EMAIL_FROM!, msg);
  if (process.env.NODE_ENV !== "production") {
    // Local development without a provider: print instead of sending so the flow stays testable.
    console.info(`\n[email:dev] to=${msg.to} subject="${msg.subject}"\n${msg.text}\n`);
    return;
  }
  throw new EmailNotConfiguredError("Email sending isn't configured on this server (set GMAIL_USER + GMAIL_APP_PASSWORD, or RESEND_API_KEY + EMAIL_FROM).");
}

export function codeEmail(code: string, purpose: "VERIFY" | "SIGNIN"): Omit<OutgoingEmail, "to"> {
  const action = purpose === "VERIFY" ? "verify your email" : "sign in";
  const subject = `${code} is your VibeCheck code`;
  const text = `Your VibeCheck code to ${action} is ${code}.\n\nIt expires in 10 minutes. If you didn't request it, you can ignore this email.`;
  const html = `<!doctype html><html><body style="margin:0;padding:32px 16px;background:#f7f7f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0a0a0a">
<table role="presentation" width="100%" style="max-width:440px;margin:0 auto;background:#fff;border:1px solid #e8e8e8;border-radius:16px"><tr><td style="padding:32px">
<p style="margin:0 0 4px;font-weight:600;font-size:15px">VibeCheck</p>
<p style="margin:0 0 24px;color:#5f5f5f;font-size:14px">Your code to ${action}:</p>
<p style="margin:0 0 24px;font-size:32px;font-weight:600;letter-spacing:8px;font-family:ui-monospace,Menlo,monospace">${code}</p>
<p style="margin:0;color:#5f5f5f;font-size:13px;line-height:1.5">It expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
</td></tr></table></body></html>`;
  return { subject, text, html };
}
