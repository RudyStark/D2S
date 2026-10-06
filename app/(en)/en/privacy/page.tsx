import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/pages/LegalPage";
import { PRIVACY_CONTACT, PUBLISHER, legalHrefOf } from "@/lib/legal";
import { pageAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How D2S AIgency handles messages sent to May, contact requests and meeting bookings.",
  alternates: pageAlternates("/confidentialite", "en"),
};

/* English translation of /confidentialite (the French version prevails): keep both true when the site changes. */
const contact = <>{PRIVACY_CONTACT ?? PUBLISHER.email}</>;

const SECTIONS: LegalSection[] = [
  {
    id: "controller",
    title: "Who is responsible for your data?",
    body: (
      <>
        <p>
          The data controller is <strong>{PUBLISHER.brand}</strong> ({PUBLISHER.legalName}, {PUBLISHER.address}, France).
        </p>
        <p>For any question about your data: {contact}.</p>
      </>
    ),
  },
  {
    id: "data",
    title: "What data do we collect?",
    body: (
      <>
        <p>
          The data you send us in May’s chat, with the <strong>“Let’s talk about your project”</strong> form or with the menu’s{" "}
          <strong>“Contact”</strong> window:
        </p>
        <ul>
          <li>first and last name, work e-mail, company;</li>
          <li>phone number, if you choose to give it (optional);</li>
          <li>your message, the type of project or topic chosen and how you prefer to talk (video call, phone, e-mail);</li>
          <li>the button that brought you to the form (for example an agent’s profile);</li>
          <li>the summary of your “How to choose your AI agent?” diagnostic, only if it is attached to the request (you can remove it before sending);</li>
          <li>the messages of your conversation with May, when you send them in the chat.</li>
        </ul>
        <p>
          To limit abuse (repeated submissions, bots), your IP address is also used by our server, in memory and for a few minutes
          only: it is neither stored nor linked to your request.
        </p>
        <p>
          The diagnostic stays in your browser as long as you do not attach it to the form. Each message sent to May, however, is
          passed to our server and then to our artificial intelligence provider to produce her reply. If you let May prepare your
          request, or choose “Get a call back from the team”, that request (or the conversation) is copied into the form: you review it
          and can edit it before sending it yourself. The site does not keep the conversation: it disappears when you leave the page.
        </p>
        <p>
          If you pick a video-call slot in the form, your name, your e-mail address and the chosen slot are passed to Calendly to book
          the meeting: Calendly sends you the invitation, the joining link and the reminders. The availability shown is read by our
          server; no Calendly script or cookie is loaded on the site.
        </p>
      </>
    ),
  },
  {
    id: "purposes",
    title: "Why, and on what basis?",
    body: (
      <>
        <p>Your data is used to:</p>
        <ul>
          <li>answer your request or your message and organise the first call;</li>
          <li>confirm by e-mail that we received your request and, where relevant, your meeting;</li>
          <li>point you, in the chat, to the right service or AI agent;</li>
          <li>show meeting types and slots that are really available;</li>
          <li>send you a proposal, if you wish;</li>
          <li>follow up on this request within reason.</li>
        </ul>
        <p>
          Legal basis: <strong>steps taken at your request before entering into a contract</strong> (article 6(1)(b) GDPR) for
          contact and booking, and our legitimate interest in answering questions about our services for the chat (article 6(1)(f)).
          The forms’ checkboxes confirm that you agree to be contacted. No data is sold or used for advertising.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long do we keep it?",
    body: (
      <>
        <p>
          <strong>3 years from our last exchange</strong>, then it is deleted. If a contract is signed, the relevant data is kept for
          the duration of the relationship, then for the periods required by law (accounting and tax obligations).
        </p>
        <p>
          D2S creates no visitor account and does not deliberately store the chat history in a database. Technical providers may
          however keep logs for as long as needed for the security and operation of their services, according to our settings and our
          contracts with them.
        </p>
        <p>Requests identified as spam are discarded without being kept.</p>
      </>
    ),
  },
  {
    id: "recipients",
    title: "Who has access to it?",
    body: (
      <>
        <p>Only the {PUBLISHER.brand} team handling your request. Our technical providers act only on our behalf:</p>
        <dl>
          <dt>Website hosting</dt>
          <dd>Cloudflare (hosting and technical protection of the site)</dd>
          <dt>Receiving requests</dt>
          <dd>Resend (delivery of requests and confirmation e-mails)</dd>
          <dt>Team mailbox</dt>
          <dd>IONOS (the team’s e-mail, which receives the requests)</dd>
          <dt>May, the assistant</dt>
          <dd>Anthropic, Claude model via API (generating May’s replies)</dd>
          <dt>Meeting booking</dt>
          <dd>Calendly (availability and booking of the video calls chosen in the form)</dd>
          <dt>Transfers outside the EU</dt>
          <dd>
            Cloudflare, Anthropic, Calendly and Resend are US companies: data may be processed in the United States. These transfers
            are covered by the European Commission’s standard contractual clauses in their data processing agreements and, for
            certified companies, by the EU–US Data Privacy Framework.
          </dd>
        </dl>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and trackers",
    body: (
      <>
        <p>
          <strong>This site sets no cookies</strong> and uses no audience measurement or advertising tool. That is why you are not
          asked for consent.
        </p>
        <p>Fonts are served by our own server: your browser contacts no third-party service during your visit.</p>
        <p>
          Opening a booking button takes you to Calendly, whose page applies its own cookie and privacy policy. No Calendly content is
          loaded before that action.
        </p>
        <p>
          Only one technical item may be kept <strong>in the tab, for the duration of the visit</strong>: if your graphics card had to
          interrupt the 3D setting, the site remembers it to display in reduced quality. It does not identify you, is never sent, and
          disappears when the tab is closed. This strictly necessary storage is exempt from consent.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "How do we protect it?",
    body: (
      <ul>
        <li>encrypted connection (HTTPS) and strict security headers across the site;</li>
        <li>data limited to what is needed, checked and bounded on arrival;</li>
        <li>spam protection with no cookie or captcha (trap field, minimum delay, limited number of submissions);</li>
        <li>access restricted to the people handling your request.</li>
      </ul>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>
          You can at any time access your data, have it corrected or erased, restrict or object to its use, retrieve it
          (portability), and set instructions on what happens to it after your death.
        </p>
        <p>
          Write to us at {contact}. We reply within one month. If you believe your rights are not respected, you can lodge a
          complaint with the CNIL, the French data protection authority (<a href="https://www.cnil.fr/fr/plaintes">cnil.fr</a>).
        </p>
        <p>
          See also our <Link href={legalHrefOf("en")}>legal notice</Link>.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      locale="en"
      kicker="Personal data"
      title="Privacy policy"
      intro={
        <p>
          In short: May processes the messages you send her in order to reply, and the form passes on what is needed to contact you
          again. The site adds no advertising cookie or tracker. This English translation is provided for convenience; the{" "}
          <Link href="/confidentialite">French version</Link> prevails.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
