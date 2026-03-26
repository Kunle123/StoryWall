import type { Metadata } from "next";
import DiscoverHome from "./DiscoverHome";

/**
 * Explicit canonical for `/` so http/https and apex/www duplicates align with
 * https://www.storywall.com/ (requires metadataBase from NEXT_PUBLIC_APP_URL).
 */
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
  },
};

export default function HomePage() {
  return <DiscoverHome />;
}
