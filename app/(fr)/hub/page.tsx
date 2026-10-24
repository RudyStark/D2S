import type { Metadata, ResolvingMetadata } from "next";
import { HubPage, hubMetadata } from "@/components/pages/HubPage";

export function generateMetadata(_: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  return hubMetadata("fr", parent);
}

/* The public page of the client hub (app.d2saigency.com): the home page declared to Google for the OAuth app. */
export default function Page() {
  return <HubPage locale="fr" />;
}
