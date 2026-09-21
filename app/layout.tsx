import type { Metadata, Viewport } from "next";
import { Caveat, Inter, Inter_Tight } from "next/font/google";
import "./globals.css";

// Chosen by ink-mask comparison with design/references/01-home-final.png (see d2s-frontend-design skill).
const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-inter-tight",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

// Handwritten annotation on the services section (05-services-final).
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "D2S AIgency — L’agence IA qui transforme votre temps en performance",
  description:
    "D2S AIgency conçoit et déploie des agents IA sur mesure pour automatiser vos tâches, accélérer votre croissance et libérer ce qui compte vraiment.",
  icons: { icon: "/images/brand/d2s-aigency.svg" },
};

export const viewport: Viewport = {
  themeColor: "#eef3f9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${interTight.variable} ${inter.variable} ${caveat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
