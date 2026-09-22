import "server-only";
import { CHANNELS, NEEDS, type ChannelId, type NeedId } from "@/lib/contact-content";

const RESEND_API = "https://api.resend.com/emails";
const DEFAULT_MAY_EMAIL = "may@d2saigency.com";
const DEFAULT_FROM = `May — D2S AIgency <${DEFAULT_MAY_EMAIL}>`;

export interface ContactLead {
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
  need: string;
  channel: string;
  source: string;
  diagnostic: string[];
  consent: boolean;
  receivedAt: string;
}

export class ResendConfigurationError extends Error {
  constructor() {
    super("Resend is not configured");
    this.name = "ResendConfigurationError";
  }
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]!);

const paragraphs = (value: string) => escapeHtml(value).replace(/\n/g, "<br />");

function labelForNeed(value: string) {
  return NEEDS.find((item) => item.id === (value as NeedId))?.label ?? "À préciser";
}

function labelForChannel(value: string) {
  return CHANNELS.find((item) => item.id === (value as ChannelId))?.label ?? "À préciser";
}

function recipients() {
  const configured = process.env.CONTACT_TO_EMAIL?.split(",").map((value) => value.trim()).filter(Boolean);
  return configured?.length ? configured : [DEFAULT_MAY_EMAIL];
}

async function sendEmail(payload: Record<string, unknown>) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new ResendConfigurationError();
  const response = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Resend API ${response.status}`);
}

function shell(content: string) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f7fb;color:#111936;font-family:Arial,sans-serif"><div style="max-width:640px;margin:0 auto;padding:32px 18px"><div style="background:#fff;border:1px solid #dfe7f1;border-radius:20px;padding:30px"><p style="margin:0 0 24px;color:#1570f0;font-weight:700">D2S AIgency · May</p>${content}<p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #e8edf4;color:#667085;font-size:13px">D2S AIgency · L’IA, plus humaine, plus utile.</p></div></div></body></html>`;
}

/** Sends the lead to D2S, then a courtesy confirmation to the visitor. */
export async function sendContactEmails(lead: ContactLead) {
  if (!process.env.RESEND_API_KEY?.trim() && process.env.NODE_ENV !== "production") {
    console.info("[contact] development mode: Resend is not configured");
    return { delivered: false, confirmed: false, development: true };
  }

  const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;
  const mayEmail = process.env.RESEND_REPLY_TO_EMAIL?.trim() || DEFAULT_MAY_EMAIL;
  const date = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(lead.receivedAt));
  const diagnostic = lead.diagnostic.length
    ? `<h3 style="margin:24px 0 8px;font-size:16px">Diagnostic joint</h3><ul>${lead.diagnostic.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
    : "";

  await sendEmail({
    from,
    to: recipients(),
    reply_to: lead.email,
    subject: `Nouveau projet · ${labelForNeed(lead.need)} · ${lead.company}`,
    text: [
      `Nouvelle demande reçue le ${date}`,
      `Nom : ${lead.name}`,
      `E-mail : ${lead.email}`,
      `Entreprise : ${lead.company}`,
      `Téléphone : ${lead.phone || "Non renseigné"}`,
      `Besoin : ${labelForNeed(lead.need)}`,
      `Échange souhaité : ${labelForChannel(lead.channel)}`,
      `Source : ${lead.source || "direct"}`,
      "",
      lead.message,
      ...(lead.diagnostic.length ? ["", "Diagnostic :", ...lead.diagnostic] : []),
    ].join("\n"),
    html: shell(`
      <h1 style="margin:0 0 8px;font-size:25px">Nouvelle demande de ${escapeHtml(lead.name)}</h1>
      <p style="margin:0 0 24px;color:#667085">Reçue le ${escapeHtml(date)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;color:#667085">Entreprise</td><td style="padding:6px 0;font-weight:700">${escapeHtml(lead.company)}</td></tr>
        <tr><td style="padding:6px 0;color:#667085">E-mail</td><td style="padding:6px 0"><a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a></td></tr>
        <tr><td style="padding:6px 0;color:#667085">Téléphone</td><td style="padding:6px 0">${escapeHtml(lead.phone || "Non renseigné")}</td></tr>
        <tr><td style="padding:6px 0;color:#667085">Besoin</td><td style="padding:6px 0">${escapeHtml(labelForNeed(lead.need))}</td></tr>
        <tr><td style="padding:6px 0;color:#667085">Canal</td><td style="padding:6px 0">${escapeHtml(labelForChannel(lead.channel))}</td></tr>
        <tr><td style="padding:6px 0;color:#667085">Source</td><td style="padding:6px 0">${escapeHtml(lead.source || "direct")}</td></tr>
      </table>
      <h3 style="margin:24px 0 8px;font-size:16px">Message</h3>
      <p style="margin:0;line-height:1.65">${paragraphs(lead.message)}</p>
      ${diagnostic}
    `),
  });

  let confirmed = true;
  try {
    await sendEmail({
      from,
      to: [lead.email],
      reply_to: mayEmail,
      subject: "Votre demande a bien été reçue · D2S AIgency",
      text: `Bonjour ${lead.name.split(/\s+/)[0]},\n\nJ’ai bien transmis votre demande à l’équipe D2S AIgency. Nous revenons vers vous sous 24 h ouvrées.\n\nÀ très vite,\nMay\nD2S AIgency`,
      html: shell(`
        <h1 style="margin:0 0 14px;font-size:25px">Votre demande est bien arrivée.</h1>
        <p style="line-height:1.65">Bonjour ${escapeHtml(lead.name.split(/\s+/)[0] || lead.name)},</p>
        <p style="line-height:1.65">J’ai transmis votre demande à l’équipe D2S AIgency. Un humain revient vers vous sous <strong>24 h ouvrées</strong>.</p>
        <p style="margin:24px 0 0;line-height:1.65">À très vite,<br /><strong>May</strong><br />Commerciale IA · D2S AIgency</p>
      `),
    });
  } catch (error) {
    confirmed = false;
    console.error("[contact] confirmation email failed:", error instanceof Error ? error.message : "unknown error");
  }

  return { delivered: true, confirmed, development: false };
}
