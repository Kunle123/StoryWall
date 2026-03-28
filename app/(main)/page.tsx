import type { Metadata } from "next";
import DiscoverHome from "./DiscoverHome";

/**
 * Explicit canonical for `/` so http/https and apex/www duplicates align with
 * https://www.storywall.com/ (requires metadataBase from NEXT_PUBLIC_APP_URL).
 */
export const metadata: Metadata = {
  title:
    "StoryWall — Visual timelines for explainers, history & stories worth sharing",
  description:
    "Turn topics and events into visual timelines that are easy to understand and easy to share. Free to start — ~30 AI images, enough for several stories. Built for current affairs, history, and explainers where order matters.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title:
      "StoryWall — Visual timelines for explainers, history & stories worth sharing",
    description:
      "Create visual timelines with AI or your images. Free to start; strong for explainers, histories, and shareable arcs.",
    url: "/",
  },
};

export default function HomePage() {
  return <DiscoverHome />;
}
