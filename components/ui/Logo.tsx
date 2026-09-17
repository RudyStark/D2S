import Link from "next/link";
import { LOGO_SRC, LOGO_VIEWBOX } from "@/lib/brand";

/** Header logo. Reads the single brand SVG so a new file updates the whole site. */
export function Logo({ width = 116, className }: { width?: number; className?: string }) {
  const height = Math.round((width * LOGO_VIEWBOX.height) / LOGO_VIEWBOX.width);
  return (
    <Link href="/" className={className} aria-label="D2S Studio — accueil">
      {/* eslint-disable-next-line @next/next/no-img-element -- vector logo, no optimisation needed */}
      <img src={LOGO_SRC} alt="" width={width} height={height} style={{ width: "var(--logo-w, auto)", height: "auto" }} />
    </Link>
  );
}
