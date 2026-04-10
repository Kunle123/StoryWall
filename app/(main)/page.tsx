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
    "Context-first timelines with AI images for explainers and histories. Explore public StoryWalls, create yours in the editor; fork-to-edit remix is next. Free to start — ~30 AI images for several stories.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title:
      "StoryWall — Read the arc, share it, build your take",
    description:
      "Chronological StoryWalls with AI images. Discover public stories, publish your angle; remix from any public wall is on the way.",
    url: "/",
  },
};

export default function HomePage() {
  return <DiscoverHome />;
}
