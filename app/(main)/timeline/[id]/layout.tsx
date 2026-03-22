import type { Metadata } from "next";
import type { Event } from "@/lib/types";
import { getTimelineById, getTimelineBySlug } from "@/lib/db/timelines";
import { absoluteImageUrl } from "@/lib/utils/siteUrl";

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    str
  );
}

function firstEventImage(events: Event[] | undefined): string | undefined {
  if (!events?.length) return undefined;
  const withImg = events.find((e) => e.image_url?.trim());
  return withImg?.image_url?.trim() || undefined;
}

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

  let timeline: Awaited<ReturnType<typeof getTimelineById>> = null;
  try {
    timeline = isUUID(id)
      ? await getTimelineById(id)
      : await getTimelineBySlug(id);
  } catch {
    return {
      title: "Timeline | StoryWall",
      description: "Visual timelines with AI-generated images on StoryWall.",
    };
  }

  if (!timeline) {
    return {
      title: "Timeline not found | StoryWall",
      description: "This timeline could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const title = timeline.title || "Timeline";
  const rawDesc =
    timeline.description?.trim() ||
    `Visual timeline on StoryWall${timeline.creator?.username ? ` · ${timeline.creator.username}` : ""}`;
  const description = truncateDescription(rawDesc);

  const canonicalSegment = timeline.slug || timeline.id;
  const canonicalPath = `/timeline/${canonicalSegment}`;

  const ogImage = absoluteImageUrl(firstEventImage(timeline.events));

  const isPrivate = timeline.is_public === false;

  const base: Metadata = {
    title: `${title} | StoryWall`,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalPath,
      siteName: "StoryWall",
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                alt: title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: isPrivate
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };

  return base;
}

export default function TimelineRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
