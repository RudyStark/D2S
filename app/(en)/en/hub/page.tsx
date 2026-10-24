import type { Metadata, ResolvingMetadata } from "next";
import { HubPage, hubMetadata } from "@/components/pages/HubPage";

export function generateMetadata(_: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  return hubMetadata("en", parent);
}

/* English version of /hub (the one Google's reviewers read). */
export default function Page() {
  return <HubPage locale="en" />;
}
