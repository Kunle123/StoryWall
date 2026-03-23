import type { Metadata } from "next";
import { getEventById } from "@/lib/db/events";
import { getTimelineById } from "@/lib/db/timelines";
import { absoluteImageUrl } from "@/lib/utils/siteUrl";

function truncateDescription(text: string, max = 160): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

type ParamsInput = Promise<{ id: string }> | { id: string };

export async function generateMetadata(props: {
  params: ParamsInput;
}): Promise<Metadata> {
  const { id } = await Promise.resolve(props.params);

  let event: Awaited<ReturnType<typeof getEventById>> = null;
  try {
    event = await getEventById(id);
  } catch {
    return {
      title: "Story | StoryWall",
      description: "Timeline moments on StoryWall.",
    };
  }

  if (!event) {
    return {
      title: "Story not found | StoryWall",
      description: "This story could not be found.",
      robots: { index: false, follow: false },
    };
  }

  let timeline: Awaited<ReturnType<typeof getTimelineById>> = null;
  try {
    timeline = await getTimelineById(event.timeline_id);
  } catch {
    // Metadata still useful without parent timeline
  }

  const eventTitle = event.title?.trim() || "Story";
  const timelineName = timeline?.title?.trim();
  const ogTitle = timelineName ? `${eventTitle} · ${timelineName}` : eventTitle;

  const rawDesc =
    event.description?.trim() ||
    (timelineName
      ? `From “${timelineName}” on StoryWall`
      : "A moment on a StoryWall timeline.");
  const description = truncateDescription(rawDesc);

  const canonicalPath = `/story/${id}`;
  const ogImage = absoluteImageUrl(event.image_url?.trim());
  const isPrivate = timeline?.is_public === false;

  return {
    title: `${eventTitle} | StoryWall`,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: ogTitle,
      description,
      type: "article",
      url: canonicalPath,
      siteName: "StoryWall",
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                alt: eventTitle,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: ogTitle,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: isPrivate
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default function StoryRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
