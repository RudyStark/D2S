import type { Metadata } from "next";
import { fontClasses } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = { title: "Page introuvable · Page not found — D2S AIgency", robots: { index: false } };

/**
 * An address that matches no page (the site has two root layouts, French and English: the 404 is shared). Both
 * languages, so nobody is lost.
 */
export default function GlobalNotFound() {
  return (
    <html lang="fr" className={fontClasses}>
      <body>
        <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "24px", textAlign: "center" }}>
          <div style={{ maxWidth: 480 }}>
            <p style={{ fontWeight: 700, letterSpacing: "0.2em", color: "#1570f0", fontSize: 13 }}>404</p>
            <h1 style={{ fontFamily: "var(--font-inter-tight)", fontSize: 34, margin: "8px 0 6px", color: "#0b1238" }}>Cette page n’existe pas.</h1>
            <p style={{ color: "#4d5884", margin: 0 }} lang="en">
              This page does not exist.
            </p>
            <p style={{ marginTop: 24, display: "flex", gap: 18, justifyContent: "center", fontWeight: 600 }}>
              <a href="/" style={{ color: "#1570f0" }}>
                Retour à l’accueil
              </a>
              <a href="/en" lang="en" style={{ color: "#1570f0" }}>
                Back to the home page
              </a>
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
