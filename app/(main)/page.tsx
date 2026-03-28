import type { Metadata } from "next";
import DiscoverHome from "./DiscoverHome";

/**
 * Explicit canonical for `/` so http/https and apex/www duplicates align with
 * https://www.storywall.com/ (requires metadataBase from NEXT_PUBLIC_APP_URL).
 */
export const metadata: Metadata = {
  title: "StoryWall — Visual stories & timelines, free to start",
  description:
    "Create chronological visual stories with AI images or your own photos. Free to start — enough AI credits for several polished timelines. Best for explainers, histories, and stories worth sharing.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "StoryWall — Visual stories & timelines, free to start",
    description:
      "Visual timelines with AI or your images. Free to start; enough credits to finish real stories.",
    url: "/",
  },
};

export default function HomePage() {
  return <DiscoverHome />;
}
