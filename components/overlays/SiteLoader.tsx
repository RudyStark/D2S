"use client";

import { useEffect, useRef, useState } from "react";
import { setScrollLocked } from "@/lib/experience/director";
import { useExperience } from "@/lib/experience/store";
import styles from "./SiteLoader.module.css";

/** Loading steps shown next to the counter (by displayed progress). */
const STEPS: [number, string][] = [
  [0, "Préparation de la façade"],
  [0.3, "Mise en lumière du lobby"],
  [0.62, "Arrivée des agents IA"],
  [0.9, "Ouverture des portes"],
];

/*
 * While the agency loads, a short presentation of D2S AIgency plays on its own: the visitor reads instead of
 * waiting (perceived time). Five slides, one idea each; after the last one, it starts again at the second.
 * No figure that is not ours to promise.
 */
const FIVE = ["content", "support", "prospection", "automation", "data"];
const REST = ["fireflies", "proposition", "strategiste", "designer", "veille", "ecommerce", "gmail", "comptabilite", "presentateur", "cerveau", "orchestrateur"];
const avatar = (slug: string) => `/images/agents/${slug}-avatar.webp`;
const SLIDES: { kicker: string; title: string; text: string; visual: "team" | "all" | "tools" | "control" | "enter" }[] = [
  {
    kicker: "Bienvenue",
    title: "D2S AIgency, l’agence des agents IA.",
    text: "Nous installons dans votre entreprise des agents IA qui travaillent pour vous, chaque jour.",
    visual: "team",
  },
  {
    kicker: "Une équipe complète",
    title: "Seize experts, un métier chacun.",
    text: "Vente, contenu, gestion, pilotage : chaque agent maîtrise sa mission et passe le relais aux autres.",
    visual: "all",
  },
  {
    kicker: "Dans vos outils",
    title: "Ils travaillent là où vous travaillez.",
    text: "E-mail, LinkedIn, WhatsApp, votre site, vos tableaux : vos agents s’y branchent, 24 h/24.",
    visual: "tools",
  },
  {
    kicker: "Vous gardez la main",
    title: "Ils préparent. Vous validez.",
    text: "Rien n’est envoyé ni publié sans votre accord. Vous décidez, ils exécutent.",
    visual: "control",
  },
  {
    kicker: "C’est parti",
    title: "Entrez dans l’agence.",
    text: "Faites connaissance avec l’équipe, en 3D, puis trouvez l’agent qu’il vous faut.",
    visual: "enter",
  },
];
/** How long a slide stays (ms). */
const SLIDE_MS = 2800;
const TOOLS = ["E-mail", "LinkedIn", "WhatsApp", "Site web", "CRM", "Agenda", "Instagram", "Tableaux"];
/** Never flashes: the loader stays at least this long (ms). */
const MIN_DURATION = 1400;
/** Pause on "Bienvenue" before the doors slide open (ms). */
const HOLD = 450;
/** Doors sliding apart (ms), keep in sync with SiteLoader.module.css. */
const OPEN = 1100;

type Phase = "loading" | "welcome" | "opening" | "done";

/**
 * Full-screen site loader: the D2S AIgency logo fills with the real loading progress (every texture,
 * model, agent, font, and the shader warm-up), then the screen splits like the façade's sliding
 * doors to reveal the agency. Rendered on the server, so it covers the page from the first paint.
 */
export function SiteLoader() {
  const root = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [percent, setPercent] = useState(0);
  const [step, setStep] = useState(STEPS[0][1]);
  const [slide, setSlide] = useState(0);

  // The presentation plays while loading; after the last slide it starts again at the second.
  useEffect(() => {
    if (phase !== "loading") return;
    const id = window.setInterval(() => setSlide((s) => (s + 1 >= SLIDES.length ? 1 : s + 1)), SLIDE_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.siteLoading = "true";
    setScrollLocked(true);

    const params = new URLSearchParams(window.location.search);
    // Visual tests capture the agency itself: open instantly once ready.
    const instant = params.get("capture") === "1";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let fontsReady = false;
    document.fonts?.ready.then(() => (fontsReady = true), () => (fontsReady = true));
    if (!document.fonts) fontsReady = true;

    const start = performance.now();
    let shown = 0;
    let last = start;
    let raf = 0;
    let timers: number[] = [];

    const target = () => {
      const { webgl, assets, ready, calibrated } = useExperience.getState();
      if (webgl === "unavailable") return 1;
      // Boot (scripts, WebGL context) → assets → warm-up.
      let t = 0.06;
      if (assets.started && assets.total > 0) t = 0.06 + 0.84 * (assets.loaded / assets.total);
      // Ready, then the quality tier measured under the loader (AdaptiveQuality): the agency opens settled.
      if (ready && !assets.active) t = fontsReady && calibrated ? 1 : 0.96;
      else t = Math.min(t, 0.94);
      return t;
    };

    const open = () => {
      setPhase("welcome");
      setPercent(100);
      const hold = instant ? 0 : HOLD;
      timers.push(
        window.setTimeout(() => {
          setPhase("opening");
          delete html.dataset.siteLoading;
          html.dataset.siteLoaded = "true";
          setScrollLocked(false);
          timers.push(window.setTimeout(() => setPhase("done"), instant ? 0 : reduced ? 450 : OPEN));
        }, hold),
      );
    };

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      // While a large file downloads the real progress plateaus: a slow creep (≥ 1 %/s, never past 94 %)
      // keeps the counter alive; the real value takes over as soon as it is ahead.
      const real = target();
      const goal = real >= 1 ? 1 : Math.max(real, Math.min(0.94, shown + dt * 0.012));
      // Eased and monotonic: the asset total grows as the scene streams in, the counter never goes back.
      shown = Math.max(shown, shown + (goal - shown) * Math.min(1, dt * (goal >= 1 ? 5 : 2.4)));
      if (goal >= 1 && goal - shown < 0.004) shown = 1;
      const pct = Math.floor(shown * 100);
      setPercent(pct);
      root.current?.style.setProperty("--p", shown.toFixed(4));
      setStep(STEPS.reduce((label, [at, text]) => (shown >= at ? text : label), STEPS[0][1]));

      if (shown >= 1 && (instant || now - start >= MIN_DURATION)) {
        open();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
      timers = [];
      delete html.dataset.siteLoading;
      setScrollLocked(false);
    };
  }, []);

  if (phase === "done") return null;

  const welcome = phase !== "loading";
  return (
    <div ref={root} className={styles.loader} data-phase={phase}>
      <noscript>
        <style>{`.${styles.loader}{display:none}`}</style>
      </noscript>
      <div className={styles.door} data-side="left" aria-hidden="true" />
      <div className={styles.door} data-side="right" aria-hidden="true" />
      <div className={styles.seam} aria-hidden="true" />

      {/* The logo fills with the real progress, at the top. */}
      <div className={styles.brand} aria-hidden="true">
        <div className={styles.logo}>
          <span className={styles.logoGhost} />
          <span className={styles.logoFill} />
          <span className={styles.logoEdge} />
        </div>
      </div>

      {/* The presentation of the agency (decorative for assistive tech: the status below says what happens). */}
      <div className={styles.stage} aria-hidden="true">
        {SLIDES.map((sl, i) => (
          <section key={sl.kicker} className={styles.slide} data-active={i === slide} data-past={i < slide}>
            <p className={styles.kicker}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {sl.kicker}
            </p>
            <h2 className={styles.title}>{sl.title}</h2>
            <p className={styles.text}>{sl.text}</p>
            <div className={styles.visual} data-visual={sl.visual}>
              {sl.visual === "team" &&
                FIVE.map((a, k) => (
                  // eslint-disable-next-line @next/next/no-img-element -- small avatar
                  <img key={a} src={avatar(a)} alt="" width={64} height={64} style={{ "--k": k } as React.CSSProperties} />
                ))}
              {sl.visual === "all" &&
                [...FIVE, ...REST].map((a, k) => (
                  // eslint-disable-next-line @next/next/no-img-element -- small avatar
                  <img key={a} src={avatar(a)} alt="" width={44} height={44} loading="lazy" style={{ "--k": k } as React.CSSProperties} />
                ))}
              {sl.visual === "tools" &&
                TOOLS.map((t, k) => (
                  <span key={t} className={styles.tool} style={{ "--k": k } as React.CSSProperties}>
                    {t}
                  </span>
                ))}
              {sl.visual === "control" && (
                <div className={styles.approve}>
                  <span className={styles.approveLine}>
                    <b>Brouillon préparé par votre agent</b>
                    <i />
                    <i />
                  </span>
                  <span className={styles.approveButton}>✓ Valider et envoyer</span>
                </div>
              )}
              {sl.visual === "enter" && (
                <span className={styles.doors}>
                  <i />
                  <i />
                </span>
              )}
            </div>
          </section>
        ))}
      </div>

      <div
        className={styles.foot}
        role="progressbar"
        aria-label="Chargement de l’agence D2S AIgency"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <ol className={styles.dots} aria-hidden="true">
          {SLIDES.map((sl, i) => (
            <li key={sl.kicker} data-active={i === slide} />
          ))}
        </ol>
        <p className={styles.label}>
          <span>{welcome ? "Bienvenue chez D2S AIgency" : step}</span>
          {!welcome && <span className={styles.percent}>{percent} %</span>}
        </p>
        <span className={styles.bar} aria-hidden="true" />
      </div>
      <p className="visually-hidden" role="status">
        {welcome ? "L’agence est prête." : ""}
      </p>
    </div>
  );
}
