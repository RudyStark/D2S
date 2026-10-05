import { Caveat, Inter, Inter_Tight } from "next/font/google";

// Chosen by ink-mask comparison with design/references/01-home-final.png (see d2s-frontend-design skill).
export const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

// Handwritten annotation on the services section (05-services-final).
export const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-script",
  display: "swap",
});

export const fontClasses = `${interTight.variable} ${inter.variable} ${caveat.variable}`;
