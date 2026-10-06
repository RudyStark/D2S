import { AdaptiveHome } from "@/components/home/AdaptiveHome";
import { StructuredData } from "@/components/seo/StructuredData";

/** The home page in English (/en): the same experience, the texts follow the layout's language. */
export default function Home() {
  return (
    <>
      <StructuredData locale="en" />
      <AdaptiveHome />
    </>
  );
}
