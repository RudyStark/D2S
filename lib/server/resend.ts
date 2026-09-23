import "server-only";
import { CHANNELS, DIRECT_TOPICS, NEEDS, type ChannelId, type NeedId } from "@/lib/contact-content";

const RESEND_API = "https://api.resend.com/emails";
const DEFAULT_MAY_EMAIL = "may@d2saigency.com";
/** Where requests and bookings land (CONTACT_TO_EMAIL overrides it). May only signs the visitor's emails. */
const DEFAULT_TEAM_EMAIL = "rudy.saksik@d2saigency.com";
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
  /** Visio slot picked in the form, booked directly or to be confirmed by the visitor on Calendly. */
  slot?: {
    /** Paris time, for the team. */
    label: string;
    /** The visitor's own time zone, for their confirmation. */
    visitorLabel: string;
    booked: boolean;
    joinUrl?: string;
    cancelUrl?: string;
    rescheduleUrl?: string;
    confirmUrl?: string;
  };
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
  return configured?.length ? configured : [DEFAULT_TEAM_EMAIL];
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
  if (!response.ok) {
    // Resend explains the refusal (unverified domain, restricted key…): keep that, never the email content.
    const detail = ((await response.json().catch(() => null)) as { message?: string } | null)?.message?.slice(0, 200);
    throw new Error(`Resend API ${response.status}${detail ? ` : ${detail}` : ""}`);
  }
}

function shell(content: string) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f7fb;color:#111936;font-family:Arial,sans-serif"><div style="max-width:640px;margin:0 auto;padding:32px 18px"><div style="background:#fff;border:1px solid #dfe7f1;border-radius:20px;padding:30px"><p style="margin:0 0 24px;color:#1570f0;font-weight:700">D2S AIgency · May</p>${content}<p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #e8edf4;color:#667085;font-size:13px">D2S AIgency · L’IA, plus humaine, plus utile.</p></div></div></body></html>`;
}

const button = (href: string, label: string) =>
  `<a href="${escapeHtml(href)}" style="display:inline-block;margin:6px 0 4px;padding:13px 22px;border-radius:999px;background:#1570f0;color:#fff;font-weight:700;text-decoration:none">${escapeHtml(label)}</a>`;
const SIGNATURE = `<p style="margin:24px 0 0;line-height:1.65">À très vite,<br /><strong>May</strong><br />Commerciale IA · D2S AIgency</p>`;

/**
 * The visitor's email, signed by May (sent from may@d2saigency.com): a booked visio (date, video link, move or
 * cancel), a slot still to confirm on Calendly, or a plain "we got your request".
 */
function visitorConfirmation(lead: ContactLead) {
  const first = lead.name.split(/\s+/)[0] || lead.name;
  const hello = `<p style="line-height:1.65">Bonjour ${escapeHtml(first)},</p>`;
  const slot = lead.slot;

  if (slot?.booked) {
    const manage = [slot.rescheduleUrl && `<a href="${escapeHtml(slot.rescheduleUrl)}">déplacer</a>`, slot.cancelUrl && `<a href="${escapeHtml(slot.cancelUrl)}">annuler</a>`]
      .filter(Boolean)
      .join(" ou ");
    return {
      subject: `Votre visio avec D2S AIgency est confirmée · ${slot.visitorLabel}`,
      text: [
        `Bonjour ${first},`,
        "",
        `Votre visio avec l’équipe D2S AIgency est confirmée le ${slot.visitorLabel} (30 minutes).`,
        slot.joinUrl ? `Lien de connexion : ${slot.joinUrl}` : "Le lien de connexion figure dans l’invitation de votre agenda.",
        slot.rescheduleUrl ? `Pour déplacer le rendez-vous : ${slot.rescheduleUrl}` : "",
        slot.cancelUrl ? `Pour l’annuler : ${slot.cancelUrl}` : "",
        "",
        "À très vite,",
        "May",
        "D2S AIgency",
      ]
        .filter((line, i, all) => line || all[i - 1])
        .join("\n"),
      html: shell(`
        <h1 style="margin:0 0 14px;font-size:25px">Votre visio est confirmée.</h1>
        ${hello}
        <p style="line-height:1.65">Rendez-vous le <strong>${escapeHtml(slot.visitorLabel)}</strong> avec l’équipe D2S AIgency, pour 30 minutes. Nous aurons lu votre demande avant l’échange.</p>
        ${slot.joinUrl ? button(slot.joinUrl, "Rejoindre la visio") : `<p style="line-height:1.65">Le lien de connexion figure dans l’invitation ajoutée à votre agenda.</p>`}
        ${manage ? `<p style="margin:14px 0 0;color:#667085;font-size:13px;line-height:1.6">Un empêchement ? Vous pouvez ${manage} ce rendez-vous.</p>` : ""}
        ${SIGNATURE}
      `),
    };
  }

  if (slot?.confirmUrl) {
    return {
      subject: "Dernière étape : confirmez votre visio · D2S AIgency",
      text: `Bonjour ${first},\n\nJ’ai bien transmis votre demande à l’équipe. Pour réserver votre visio du ${slot.visitorLabel}, confirmez-la ici (vos informations sont déjà remplies) : ${slot.confirmUrl}\n\nÀ très vite,\nMay\nD2S AIgency`,
      html: shell(`
        <h1 style="margin:0 0 14px;font-size:25px">Plus qu’un clic pour votre visio.</h1>
        ${hello}
        <p style="line-height:1.65">J’ai transmis votre demande à l’équipe. Pour réserver votre visio du <strong>${escapeHtml(slot.visitorLabel)}</strong>, confirmez-la sur notre agenda : vos informations sont déjà remplies.</p>
        ${button(slot.confirmUrl, "Confirmer ma visio")}
        ${SIGNATURE}
      `),
    };
  }

  return {
    subject: "Votre demande a bien été reçue · D2S AIgency",
    text: `Bonjour ${first},\n\nJ’ai bien transmis votre demande à l’équipe D2S AIgency. Nous revenons vers vous sous 24 h ouvrées.\n\nÀ très vite,\nMay\nD2S AIgency`,
    html: shell(`
      <h1 style="margin:0 0 14px;font-size:25px">Votre demande est bien arrivée.</h1>
      ${hello}
      <p style="line-height:1.65">J’ai transmis votre demande à l’équipe D2S AIgency. Un humain revient vers vous sous <strong>24 h ouvrées</strong>.</p>
      ${SIGNATURE}
    `),
  };
}

/** Sends the lead to the team (rudy.saksik@d2saigency.com), then May's confirmation to the visitor. */
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
      ...(lead.slot ? [`Créneau choisi : ${lead.slot.label} (${lead.slot.booked ? "réservé dans Calendly" : "à confirmer par le visiteur sur Calendly"})`] : []),
      ...(lead.slot?.joinUrl ? [`Lien de la visio : ${lead.slot.joinUrl}`] : []),
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
        ${lead.slot ? `<tr><td style="padding:6px 0;color:#667085">Créneau</td><td style="padding:6px 0;font-weight:700">${escapeHtml(lead.slot.label)} · ${lead.slot.booked ? "réservé dans Calendly" : "à confirmer par le visiteur sur Calendly"}${lead.slot.joinUrl ? ` · <a href="${escapeHtml(lead.slot.joinUrl)}">lien de la visio</a>` : ""}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#667085">Source</td><td style="padding:6px 0">${escapeHtml(lead.source || "direct")}</td></tr>
      </table>
      <h3 style="margin:24px 0 8px;font-size:16px">Message</h3>
      <p style="margin:0;line-height:1.65">${paragraphs(lead.message)}</p>
      ${diagnostic}
    `),
  });

  let confirmed = true;
  try {
    await sendEmail({ from, to: [lead.email], reply_to: mayEmail, ...visitorConfirmation(lead) });
  } catch (error) {
    confirmed = false;
    console.error("[contact] confirmation email failed:", error instanceof Error ? error.message : "unknown error");
  }

  return { delivered: true, confirmed, development: false };
}

/* ---------- Direct contact (the menu's "Contact" dialog) ---------- */

export interface DirectMessage {
  topic: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
  receivedAt: string;
}

/** Sends a direct message to the team (Reply-To = the visitor), then May's acknowledgement to the visitor. */
export async function sendDirectMessage(msg: DirectMessage) {
  if (!process.env.RESEND_API_KEY?.trim() && process.env.NODE_ENV !== "production") {
    console.info("[message] development mode: Resend is not configured");
    return;
  }
  const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;
  const mayEmail = process.env.RESEND_REPLY_TO_EMAIL?.trim() || DEFAULT_MAY_EMAIL;
  const topic = DIRECT_TOPICS.find((t) => t.id === msg.topic)?.label ?? "Autre sujet";
  const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(msg.receivedAt));
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;color:#667085;width:120px">${label}</td><td style="padding:6px 0">${value}</td></tr>`;

  await sendEmail({
    from,
    to: recipients(),
    reply_to: msg.email,
    subject: `Contact · ${topic} · ${msg.name}${msg.company ? ` (${msg.company})` : ""}`,
    text: [
      `Message reçu le ${date} (contact direct du site)`,
      `Sujet : ${topic}`,
      `Nom : ${msg.name}`,
      `E-mail : ${msg.email}`,
      `Entreprise : ${msg.company || "Non renseignée"}`,
      `Téléphone : ${msg.phone || "Non renseigné"}`,
      "",
      msg.message,
    ].join("\n"),
    html: shell(`
      <h1 style="margin:0 0 8px;font-size:25px">${escapeHtml(topic)}</h1>
      <p style="margin:0 0 24px;color:#667085">Message de ${escapeHtml(msg.name)} · reçu le ${escapeHtml(date)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${row("E-mail", `<a href="mailto:${escapeHtml(msg.email)}">${escapeHtml(msg.email)}</a>`)}
        ${row("Entreprise", escapeHtml(msg.company || "Non renseignée"))}
        ${row("Téléphone", escapeHtml(msg.phone || "Non renseigné"))}
      </table>
      <h3 style="margin:24px 0 8px;font-size:16px">Message</h3>
      <p style="margin:0;line-height:1.65">${paragraphs(msg.message)}</p>
    `),
  });

  try {
    const first = msg.name.split(/\s+/)[0] || msg.name;
    await sendEmail({
      from,
      to: [msg.email],
      reply_to: mayEmail,
      subject: "Votre message a bien été reçu · D2S AIgency",
      text: `Bonjour ${first},\n\nVotre message (« ${topic} ») est bien arrivé : je l’ai transmis à l’équipe D2S AIgency, qui vous répond sous 24 h ouvrées.\n\nÀ très vite,\nMay\nD2S AIgency`,
      html: shell(`
        <h1 style="margin:0 0 14px;font-size:25px">Votre message est bien arrivé.</h1>
        <p style="line-height:1.65">Bonjour ${escapeHtml(first)},</p>
        <p style="line-height:1.65">Je l’ai transmis à l’équipe D2S AIgency (sujet : <strong>${escapeHtml(topic)}</strong>). Un humain vous répond sous <strong>24 h ouvrées</strong>.</p>
        ${SIGNATURE}
      `),
    });
  } catch (error) {
    console.error("[message] acknowledgement failed:", error instanceof Error ? error.message : "unknown error");
  }
}
