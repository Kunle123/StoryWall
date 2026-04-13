import type { Metadata } from "next";
import DiscoverHome from "./DiscoverHome";

/**
 * Explicit canonical for `/` so http/https and apex/www duplicates align with
 * https://www.storywall.com/ (requires metadataBase from NEXT_PUBLIC_APP_URL).
 */
export const metadata: Metadata = {
  title:
    "StoryWall — Read the arc, share it, build your take",
  description:
    "Context-first timelines for explainers and histories—AI helps research beats and draft copy you verify, plus optional AI illustrations. Explore public StoryWalls; fork-to-edit remix is next. Free to start — ~30 AI image credits.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title:
      "StoryWall — Read the arc, share it, build your take",
    description:
      "Chronological StoryWalls with AI-assisted research and optional AI images. Discover public stories, publish your angle; remix from any public wall is on the way.",
    url: "/",
  },
};

export default function HomePage() {
  return <DiscoverHome />;
}
