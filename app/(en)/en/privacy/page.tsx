import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { LegalPage, type LegalSection } from "@/components/pages/LegalPage";
import { PRIVACY_CONTACT, PUBLISHER, legalHrefOf } from "@/lib/legal";
import { pageAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How D2S AIgency handles messages sent to May, contact requests, meeting bookings and the Google or Outlook calendars its clients connect to the hub.",
  alternates: pageAlternates("/confidentialite", "en"),
};

/*
 * English translation of /confidentialite (the French version prevails): keep both true when the site or the hub's
 * calendar connection changes. The Limited Use statement is Google's own wording: keep it word for word.
 */
const contact = <>{PRIVACY_CONTACT ?? PUBLISHER.email}</>;

/* The calendar section's sub-headings and quoted Google statement (LegalPage.module.css styles neither). */
const SUB: CSSProperties = { margin: "18px 0 6px", fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "var(--ink)" };
const QUOTE: CSSProperties = { margin: "4px 0 12px", padding: "12px 16px 2px", borderLeft: "3px solid var(--blue)", borderRadius: "0 10px 10px 0", background: "var(--blue-tint)" };

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
        <p>
          Only the {PUBLISHER.brand} team handling your request. Our technical providers act only on our behalf, or on behalf of the
          client company when the hub uses its own accounts (ElevenLabs, Twilio, Fireflies…):
        </p>
        <dl>
          <dt>Website and hub hosting</dt>
          <dd>Cloudflare (hosting and technical protection of the site and of the app.d2saigency.com hub)</dd>
          <dt>Hub database</dt>
          <dd>Supabase (database of the app.d2saigency.com hub, hosted in Ireland, in the European Union)</dd>
          <dt>Receiving requests</dt>
          <dd>Resend (delivery of requests and confirmation e-mails)</dd>
          <dt>Team mailbox</dt>
          <dd>IONOS (the team’s e-mail, which receives the requests)</dd>
          <dt>May and the hub’s agents</dt>
          <dd>Anthropic, Claude model via API (generating the replies of May and of the hub’s agents)</dd>
          <dt>Meeting booking</dt>
          <dd>Calendly (availability and booking of the video calls chosen in the form)</dd>
          <dt>Loic’s voice</dt>
          <dd>ElevenLabs (voice and conversations of Loic, the hub’s reception agent, on the client company’s ElevenLabs account)</dd>
          <dt>Loic’s phone and text messages</dt>
          <dd>Twilio (Loic’s phone number and text messages, on the client company’s Twilio account)</dd>
          <dt>Jules’s video calls</dt>
          <dd>Fireflies (recording and transcription of the video calls the client company sends Jules into, on its Fireflies account)</dd>
          <dt>Transfers outside the EU</dt>
          <dd>
            Cloudflare, Anthropic, Calendly, Resend, ElevenLabs, Twilio, Fireflies and Supabase are US companies: data may be
            processed in the United States. The hub’s database, however, is stored by Supabase in Ireland, in the European Union.
            These transfers are covered by the European Commission’s standard contractual clauses in their data processing agreements
            and, for certified companies, by the EU–US Data Privacy Framework.
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
          The app.d2saigency.com hub, reserved for our clients, uses only the cookies strictly needed to sign in to their account and,
          while a service is connected at Google or Microsoft, a 10-minute technical cookie.
        </p>
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
    id: "google-calendar",
    alias: "google-agenda",
    title: "Connecting your Google or Outlook calendar to the D2S AIgency hub",
    body: (
      <>
        <p>
          The <strong>app.d2saigency.com</strong> hub is the space reserved for {PUBLISHER.brand}’s clients, where their AI agents work.
          A client company can connect its Google calendar (or Outlook) there, under <strong>Configuration → Votre agenda</strong> (your
          calendar), so that its agents offer genuinely free slots and add the meetings they arrange to that calendar: Inès for
          meetings agreed by e-mail, Loic for those booked on the phone or in the chat on the company’s website, Diva for job
          interviews. This connection is optional: without it, the agents only know the meetings that went through the hub.
        </p>

        <h3 style={SUB}>What the hub asks Google for, and why</h3>
        <ul>
          <li>
            <strong>Your e-mail address and basic profile</strong> (“openid”, “email” and “profile” scopes): to know which Google
            account is connected. Only the address is kept; your name, which Google passes on when you connect, is not stored.
          </li>
          <li>
            <strong>Your busy times</strong> (“calendar.freebusy”): the start and end of the periods when your primary calendar is
            busy, so that only genuinely free slots are offered. This permission never gives the title, location, attendees or
            content of your events.
          </li>
          <li>
            <strong>The events created by your agents</strong> (“calendar.events.owned”): to add a meeting arranged by an agent to your
            primary calendar and, if it is cancelled or moved through the hub, to remove it. Google presents this permission as access to
            the events of the calendars you own: the hub uses it only for this, and does not read, change or delete any other event in
            your calendar.
          </li>
        </ul>

        <h3 style={SUB}>What your agents write in your calendar</h3>
        <ul>
          <li>Inès: the meeting’s title, time and place, the subject of the e-mail that arranged it and the invited person (name and e-mail address);</li>
          <li>Loic: the meeting’s title, time and place, the person’s contact details and the details they gave;</li>
          <li>Diva: the interview’s time and place, the position, and the candidate’s name and e-mail address;</li>
          <li>
            for a healthcare practice, nothing that could reveal a reason for the visit or a health detail: Loic and Inès write only
            the time, the place, initials and a link to the hub, without inviting anyone or creating a Google Meet link; the name,
            contact details, e-mail subject and reason for the visit stay in the hub (if the connected calendar is Calendly, which
            books by e-mail address, the person’s name and address are passed to it). Diva’s interviews, which do not concern
            patients, are written as above, with the candidate invited.
          </li>
        </ul>
        <p>
          Outside healthcare practices, the person is invited to Inès’s and Diva’s meetings: Google sends them the invitation, then
          the cancellation if the meeting is cancelled through the hub. In a healthcare practice, only the candidate for one of Diva’s
          interviews is invited; Inès then attaches her own invitation to her reply. Loic never invites anyone: he confirms his
          appointments himself, by text message or e-mail. For a video call, Google may create a Google Meet link (never for Loic and
          Inès in a healthcare practice), which the hub keeps along with the event’s identifier.
        </p>

        <h3 style={SUB}>Where this data goes</h3>
        <p>Only where the service requires it:</p>
        <ul>
          <li>
            <strong>Cloudflare</strong>: the hub runs on its servers, through which the exchanges with Google pass;
          </li>
          <li>
            <strong>Supabase</strong>: the hub’s database, hosted in Ireland (European Union), keeps the connected account’s address,
            the encrypted access, the result of the last check (the calendar answers, number of busy periods in the week), each
            meeting’s event identifier and video link, as well as the slots your agents offered (held for a few days for the person
            they were offered to) and the text of Inès’s replies and Loic’s conversations that mention them;
          </li>
          <li>
            <strong>Anthropic</strong> (Claude model): to write Inès’s and Loic’s replies, it receives the free slots worked out from
            your calendar, never your events;
          </li>
          <li>
            <strong>ElevenLabs</strong>: during a call or a conversation in your website’s chat, Loic receives the free slots in order to
            offer them (on your company’s ElevenLabs account, which keeps the conversation for 30 days without recording the voice);
          </li>
          <li>
            <strong>Twilio</strong>: the confirmation and reminder text messages sent to the person give the date, the time and, for a
            video call, the link;
          </li>
          <li>
            <strong>Fireflies</strong> (on your company’s account): if you send Jules into a video call, it receives the meeting’s
            Google Meet link in order to join it;
          </li>
          <li>
            confirmation e-mails, sent from your mailbox or, failing that, through Resend, give the same information, and Inès’s morning
            brief, sent to your team through Resend, gives the time and place or video link of the day’s meetings;
          </li>
          <li>
            the people your agents book meetings with (correspondents, callers, candidates) see the free slots offered to them.
          </li>
        </ul>

        <h3 style={SUB}>How long</h3>
        <ul>
          <li>
            The access to your calendar (the token Google gives us) is kept, encrypted, for as long as the calendar is connected. The
            temporary access derived from it, valid for one hour, stays in memory only.
          </li>
          <li>
            Your busy times are read when an agent needs them, held in the server’s memory, reused for two minutes at most, and never
            written to a database.
          </li>
          <li>
            The meetings arranged by your agents, with the event’s identifier and the video link, are part of your space: they are kept
            like the rest of your contract’s data (see <a href="#retention">“How long do we keep it?”</a>).
          </li>
          <li>
            The slots offered by your agents, and the replies or conversations that mention them, are kept the same way; a slot that
            was offered but not taken is freed after 5 days at most.
          </li>
          <li>
            When you disconnect the calendar, the access and the account’s address are erased from the hub’s configuration, and we ask
            Google to revoke the access, unless the same Google account is still connected as another hub workspace’s calendar (at
            Google, revoking it would revoke it for that workspace too). The account’s address may still appear in the follow-up messages of your space (when the{" "}
            {PUBLISHER.brand} team connected the calendar for you, or when it stopped answering), kept with the rest of your
            conversations. Meetings already added stay in your calendar and in your space.
          </li>
        </ul>

        <h3 style={SUB}>Our commitments</h3>
        <ul>
          <li>
            data received from Google is used only to offer your free slots and to organise your agents’ meetings (adding them,
            cancelling them, sharing their video link);
          </li>
          <li>it is not sold, rented or used for advertising (targeted or not), nor to assess creditworthiness or for lending;</li>
          <li>it is not used, or passed on, to create, train or improve artificial intelligence or machine learning models;</li>
          <li>it is passed only to the recipients listed above (our providers and the people your agents book meetings with), to the extent the service requires, or when the law requires it;</li>
          <li>
            nobody at {PUBLISHER.brand} looks at it, except at your request for a support question, for security (investigating abuse or
            a breach) or to comply with the law.
          </li>
        </ul>

        <h3 style={SUB}>Security</h3>
        <p>
          You connect on Google’s own page: you never type your password into the hub. The access Google gives us is encrypted
          (AES-GCM) before it is stored, is never sent back to the browser and is read only by our server. Exchanges are encrypted
          (HTTPS), and your space is open only to your company’s accounts and, for support, to the {PUBLISHER.brand} team.
        </p>

        <h3 style={SUB}>With Outlook</h3>
        <p>
          The hub asks Microsoft for permission to read and change your calendar (“Calendars.ReadWrite”) but uses it the same way: it
          uses only the start, end and status of your busy periods, and creates or cancels only your agents’ meetings (with a Teams
          link for a video call, never for Loic and Inès in a healthcare practice). Microsoft offers no remote revocation: when you disconnect, the access is erased from the hub; also
          remove the application in your Microsoft account settings.
        </p>

        <h3 style={SUB}>Disconnecting your calendar</h3>
        <p>
          At any time, in the hub: <strong>Configuration → Votre agenda (your calendar) → Déconnecter (disconnect)</strong>. You can
          also remove {PUBLISHER.brand}’s access from your Google account:{" "}
          <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>.
        </p>

        <h3 style={SUB}>Limited Use disclosure (Google)</h3>
        <blockquote style={QUOTE}>
          <p>
            D2S AIgency’s use and transfer to any other app of information received from Google APIs will adhere to{" "}
            <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, including
            the Limited Use requirements.
          </p>
          <p>
            The use of information received from Google Workspace APIs will adhere to the{" "}
            <a href="https://developers.google.com/workspace/workspace-api-user-data-developer-policy">
              Google Workspace API User Data and Developer Policy
            </a>
            .
          </p>
        </blockquote>
      </>
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
          again. The site adds no advertising cookie or tracker. Hub clients: what our agents do with your Google or Outlook calendar
          is set out in <a href="#google-calendar">“Connecting your Google or Outlook calendar”</a>. This English translation is
          provided for convenience; the <Link href="/confidentialite">French version</Link> prevails.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
