import { AdaptiveHome } from "@/components/home/AdaptiveHome";
import { StructuredData } from "@/components/seo/StructuredData";

/** Shared SEO; the separate mobile tree never imports the desktop WebGL experience. */
export default function Home() {
  return (
    <>
      <StructuredData />
      <AdaptiveHome />
    </>
  );
}
