"use client";

import { useState, useEffect, useMemo, Fragment, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Search,
  TrendingUp,
  Clock,
  Star,
  Sparkles,
  ImageIcon,
  ListOrdered,
  Share2,
  Crosshair,
  History,
  BookOpen,
  Play,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchTimelines, fetchFeaturedTimelines } from "@/lib/api/client";
import {
  deriveDiscoverCardLabels,
  deriveExpandedDiscoverHeadline,
} from "@/lib/utils/discoverCardLabels";
import { DiscoverInlineTimeline } from "@/components/discover/DiscoverInlineTimeline";
import { ExperimentalBottomMenuBar } from "@/components/layout/ExperimentalBottomMenuBar";
import { DiscoverCardSkeleton } from "@/components/timeline/DiscoverCardSkeleton";
import { StorySummaryCard } from "@/components/timeline/StorySummaryCard";
import { FeaturedStorySpotlight } from "@/components/timeline/FeaturedStorySpotlight";

interface TimelineDisplay {
  id: string;
  title: string;
  description?: string;
  creator: string;
  creatorId?: string;
  views: string;
  viewCount: number;
  avatar: string;
  createdAt: string;
  /** Up to 3 event images for the strip */
  previewImages: string[];
  eventCount: number;
  likesCount: number;
  sharesCount: number;
  hashtags: string[];
  isPublic: boolean;
  /** Full-timeline date span label (e.g. 1933–1935) */
  dateBadgeTop: string;
  /** Truncated title for inverted pill (not the long description) */
  dateBadgeBottom: string;
  /** Expanded inline headline: "N events · title…" */
  expandedHeadline: string;
}

function mapApiTimeline(t: any): TimelineDisplay {
  const events = t.events || [];
  const previewImages = events
    .map((e: { image_url?: string }) => e.image_url)
    .filter(Boolean) as string[];
  const eventCount = typeof t.event_count === "number" ? t.event_count : events.length;
  const fullSpan =
    t.event_date_min && t.event_date_max
      ? { min: t.event_date_min as string, max: t.event_date_max as string }
      : null;
  const labels = deriveDiscoverCardLabels(t.title || "", eventCount, fullSpan);
  const expandedHeadline = deriveExpandedDiscoverHeadline(
    t.title || "",
    eventCount,
    labels.titlePill
  );

  return {
    id: t.id,
    title: t.title,
    description: t.description,
    creator: t.creator?.username || "Unknown",
    creatorId: t.creator_id,
    views: formatViewsStatic(t.view_count || 0),
    viewCount: t.view_count || 0,
    avatar:
      t.creator?.avatar_url ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.creator?.id || t.id}`,
    createdAt: t.created_at,
    previewImages,
    eventCount,
    likesCount: typeof t.likes_count === "number" ? t.likes_count : 0,
    sharesCount: typeof t.share_count === "number" ? t.share_count : 0,
    hashtags: Array.isArray(t.hashtags) ? t.hashtags : [],
    isPublic: t.is_public !== false,
    dateBadgeTop: labels.dateSpan,
    dateBadgeBottom: labels.titlePill,
    expandedHeadline,
  };
}

function formatViewsStatic(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

/** First hashtag as a short topic pill, or undefined */
function topicLabel(hashtags: string[]): string | undefined {
  const h = hashtags[0];
  if (!h || !h.trim()) return undefined;
  return h.charAt(0).toUpperCase() + h.slice(1).toLowerCase();
}

export default function DiscoverHome() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null);
  const inlineTimelineRef = useRef<HTMLDivElement | null>(null);
  const [allTimelines, setAllTimelines] = useState<TimelineDisplay[]>([]);
  const [featuredTimelines, setFeaturedTimelines] = useState<TimelineDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  /** Explore = timelines first; How it works = onboarding copy without pushing grids below the fold */
  const [homeSection, setHomeSection] = useState<"explore" | "how">("explore");

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setShowHeader(false);
      } else if (currentScrollY < lastScrollY) {
        setShowHeader(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    async function loadTimelines() {
      try {
        setLoading(true);
        const result = await fetchTimelines({ limit: 100, is_public: true });
        if (result.data && result.data.length > 0) {
          setAllTimelines(result.data.map(mapApiTimeline));
        } else {
          setAllTimelines([]);
        }
      } catch (error) {
        console.error("Failed to load timelines from API:", error);
        setAllTimelines([]);
      } finally {
        setLoading(false);
      }
    }

    loadTimelines();

    async function loadFeatured() {
      try {
        setFeaturedLoading(true);
        const result = await fetchFeaturedTimelines(6);
        if (result.data && result.data.length > 0) {
          setFeaturedTimelines(result.data.map(mapApiTimeline));
        } else {
          setFeaturedTimelines([]);
        }
      } catch (error) {
        console.error("Failed to load featured timelines:", error);
        setFeaturedTimelines([]);
      } finally {
        setFeaturedLoading(false);
      }
    }

    loadFeatured();
  }, []);

  const featuredIds = useMemo(
    () => new Set(featuredTimelines.map((t) => t.id)),
    [featuredTimelines]
  );

  const filteredTimelines = useMemo(() => {
    let filtered = allTimelines.filter((t) => !featuredIds.has(t.id));

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t) => {
        const tagHit = t.hashtags.some((h) => h.toLowerCase().includes(query));
        return (
          tagHit ||
          t.title.toLowerCase().includes(query) ||
          (t.description?.toLowerCase().includes(query) ?? false) ||
          t.creator.toLowerCase().includes(query)
        );
      });
    }

    if (selectedCategory) {
      const cat = selectedCategory.toLowerCase();
      filtered = filtered.filter((t) => {
        const tagHit = t.hashtags.some(
          (h) =>
            h.toLowerCase().includes(cat) ||
            cat.includes(h.toLowerCase().slice(0, Math.min(4, h.length)))
        );
        return (
          tagHit ||
          t.title.toLowerCase().includes(cat) ||
          (t.description?.toLowerCase().includes(cat) ?? false)
        );
      });
    }

    return filtered;
  }, [allTimelines, searchQuery, selectedCategory, featuredIds]);

  const trendingTimelines = useMemo(() => {
    return [...filteredTimelines].sort((a, b) => b.viewCount - a.viewCount);
  }, [filteredTimelines]);

  const recentTimelines = useMemo(() => {
    return [...filteredTimelines].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredTimelines]);

  const categories = ["Technology", "Science", "Culture", "History", "Art", "Sports"];

  const toggleExpand = (id: string) => {
    setExpandedTimelineId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    if (!expandedTimelineId) return;
    const frame = requestAnimationFrame(() => {
      inlineTimelineRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [expandedTimelineId]);

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-40">
      <Header isVisible={showHeader} />
      <main
        className={`container mx-auto px-3 max-w-6xl transition-all duration-300 ${
          showHeader ? "pt-16" : "pt-4"
        }`}
      >
        <div
          className={`fixed left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50 transition-all duration-300 ${
            showHeader ? "top-12" : "top-0"
          }`}
          style={{ height: "56px" }}
        >
          <div className="container mx-auto px-3 h-full flex items-center max-w-6xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search stories, topics, creators…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>
        </div>

        <div style={{ height: "56px" }} />

        <Tabs
          value={homeSection}
          onValueChange={(v) => setHomeSection(v as "explore" | "how")}
          className="w-full"
        >
          <div className="px-4 pt-1 pb-2 border-b border-border/40 bg-background/95">
            <TabsList className="grid w-full max-w-md grid-cols-2 h-10">
              <TabsTrigger value="explore">Explore</TabsTrigger>
              <TabsTrigger value="how" className="gap-1.5">
                <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden />
                How it works
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="explore" className="mt-0 focus-visible:outline-none">
            {/* Compact hero — timelines stay high on the page */}
            <div className="px-4 pt-3 pb-2">
              <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight leading-tight">
                Visual timelines that are easy to understand — and easy to share
              </h1>
              <p className="text-muted-foreground text-sm mt-2 max-w-2xl">
                Explainers, history, current affairs — with AI or your images.{" "}
                <button
                  type="button"
                  onClick={() => setHomeSection("how")}
                  className="text-primary font-medium underline underline-offset-2 hover:no-underline"
                >
                  How it works
                </button>
              </p>
            </div>

            <div className="px-4 pb-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
                Discover
              </p>
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Stories to explore
              </h2>
              <p className="text-muted-foreground text-sm mt-1 max-w-xl">
                Each card uses a short summary so viewers can scan and choose what to open — without
                spoiling the full story.
              </p>
            </div>

            {featuredTimelines.length > 0 && (
              <section className="mb-10 px-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">
                  Featured creator
                </p>
                <div className="grid gap-4">
                  {featuredLoading ? (
                    <>
                      <DiscoverCardSkeleton />
                      <DiscoverCardSkeleton />
                    </>
                  ) : (
                    featuredTimelines.map((timeline) => (
                      <Fragment key={timeline.id}>
                        <FeaturedStorySpotlight
                          title={timeline.title}
                          summary={timeline.description}
                          creatorName={timeline.creator}
                          creatorAvatar={timeline.avatar}
                          viewLabel={timeline.views}
                          eventCount={timeline.eventCount}
                          likesCount={timeline.likesCount}
                          sharesCount={timeline.sharesCount}
                          previewImages={timeline.previewImages}
                          badgeTop={timeline.dateBadgeTop}
                          badgeBottom={timeline.dateBadgeBottom}
                          isExpanded={expandedTimelineId === timeline.id}
                          onClick={() => toggleExpand(timeline.id)}
                        />
                        {expandedTimelineId === timeline.id && (
                          <div
                            ref={inlineTimelineRef}
                            className="w-full mt-0 overflow-hidden rounded-b-xl border-x border-b border-primary/35 bg-muted/25 shadow-lg animate-discover-expand-in motion-reduce:animate-none"
                          >
                            <DiscoverInlineTimeline
                              timelineId={timeline.id}
                              badgePeriod={timeline.dateBadgeTop}
                              badgeSubtitle={timeline.expandedHeadline}
                              onClose={() => toggleExpand(timeline.id)}
                            />
                          </div>
                        )}
                      </Fragment>
                    ))
                  )}
                </div>
              </section>
            )}

            <div className="py-4 border-b border-border/50 px-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  className="whitespace-nowrap h-7 text-xs"
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    className="whitespace-nowrap h-7 text-xs"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            <Tabs defaultValue="trending" className="mt-6 px-4">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="trending" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="recent" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent
                </TabsTrigger>
              </TabsList>

              <TabsContent value="trending" className="mt-6">
                <section>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2">
                    Browse
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold font-display">Trending now</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                      <>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <DiscoverCardSkeleton key={i} />
                        ))}
                      </>
                    ) : trendingTimelines.length === 0 ? (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        {searchQuery || selectedCategory
                          ? "No timelines match your filters"
                          : "No public timelines yet. Be the first to create one!"}
                      </div>
                    ) : (
                      trendingTimelines.map((timeline) => (
                        <Fragment key={timeline.id}>
                          <StorySummaryCard
                            title={timeline.title}
                            summary={timeline.description}
                            creatorName={timeline.creator}
                            creatorAvatar={timeline.avatar}
                            viewLabel={timeline.views}
                            eventCount={timeline.eventCount}
                            likesCount={timeline.likesCount}
                            sharesCount={timeline.sharesCount}
                            previewImages={timeline.previewImages}
                            topicLabel={topicLabel(timeline.hashtags)}
                            badgeTop={timeline.dateBadgeTop}
                            badgeBottom={timeline.dateBadgeBottom}
                            isExpanded={expandedTimelineId === timeline.id}
                            onClick={() => toggleExpand(timeline.id)}
                          />
                          {expandedTimelineId === timeline.id && (
                            <div
                              ref={inlineTimelineRef}
                              className="col-span-full sm:col-span-2 lg:col-span-3 mt-0 overflow-hidden rounded-b-xl border-x border-b border-primary/35 bg-muted/25 shadow-lg animate-discover-expand-in motion-reduce:animate-none"
                            >
                              <DiscoverInlineTimeline
                                timelineId={timeline.id}
                                badgePeriod={timeline.dateBadgeTop}
                                badgeSubtitle={timeline.expandedHeadline}
                                onClose={() => toggleExpand(timeline.id)}
                              />
                            </div>
                          )}
                        </Fragment>
                      ))
                    )}
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="recent" className="mt-6">
                <section>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2">
                    Browse
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-accent" />
                    <h2 className="text-lg font-bold font-display">Recently added</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                      <>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <DiscoverCardSkeleton key={i} />
                        ))}
                      </>
                    ) : recentTimelines.length === 0 ? (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        {searchQuery || selectedCategory
                          ? "No timelines match your filters"
                          : "No public timelines yet. Be the first to create one!"}
                      </div>
                    ) : (
                      recentTimelines.map((timeline) => (
                        <Fragment key={timeline.id}>
                          <StorySummaryCard
                            title={timeline.title}
                            summary={timeline.description}
                            creatorName={timeline.creator}
                            creatorAvatar={timeline.avatar}
                            viewLabel={timeline.views}
                            eventCount={timeline.eventCount}
                            likesCount={timeline.likesCount}
                            sharesCount={timeline.sharesCount}
                            previewImages={timeline.previewImages}
                            topicLabel={topicLabel(timeline.hashtags)}
                            badgeTop={timeline.dateBadgeTop}
                            badgeBottom={timeline.dateBadgeBottom}
                            isExpanded={expandedTimelineId === timeline.id}
                            onClick={() => toggleExpand(timeline.id)}
                          />
                          {expandedTimelineId === timeline.id && (
                            <div
                              ref={inlineTimelineRef}
                              className="col-span-full sm:col-span-2 lg:col-span-3 mt-0 overflow-hidden rounded-b-xl border-x border-b border-primary/35 bg-muted/25 shadow-lg animate-discover-expand-in motion-reduce:animate-none"
                            >
                              <DiscoverInlineTimeline
                                timelineId={timeline.id}
                                badgePeriod={timeline.dateBadgeTop}
                                badgeSubtitle={timeline.expandedHeadline}
                                onClose={() => toggleExpand(timeline.id)}
                              />
                            </div>
                          )}
                        </Fragment>
                      ))
                    )}
                  </div>
                </section>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="how" className="mt-0 pb-8 focus-visible:outline-none">
            {/* Hero — wedge-first positioning + promise */}
            <div className="px-4 pt-4 pb-4 space-y-4">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight leading-tight">
                  Visual timelines that are easy to understand — and easy to share
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base mt-3 max-w-2xl leading-relaxed">
                  Turn topics, events, and histories into chronological StoryWalls with AI images or
                  your own photos. Free to start — about{" "}
                  <span className="text-foreground/90 font-medium">30 AI images</span> included
                  (roughly three polished timelines, depending on length).
                </p>
              </div>
              <ul className="flex flex-col gap-2 text-sm">
                <li className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <span className="font-medium text-foreground">Create stories free</span>
                    <span className="text-muted-foreground"> — start without a card</span>
                  </span>
                </li>
                <li className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <ListOrdered className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <span className="font-medium text-foreground">
                      Enough credits for several real stories
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      — typically ~3 polished timelines, depending on length
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <ImageIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <span className="font-medium text-foreground">Mix AI and your images</span>
                    <span className="text-muted-foreground"> — upload whenever you want</span>
                  </span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                <span className="text-foreground/90 font-medium">First wedge:</span> current affairs
                & history explainers. Also strong for teachers, revision, and newsletter-style
                breakdowns — not “anything goes” creativity.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <Link
                  href="/guide/great-stories"
                  className="inline-flex font-medium text-primary underline-offset-4 hover:underline"
                >
                  What makes a great StoryWall?
                </Link>
                <a
                  href={
                    process.env.NEXT_PUBLIC_FEEDBACK_URL ||
                    "https://github.com/Kunle123/StoryWall/issues/new"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex font-medium text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
                >
                  Feedback
                </a>
              </div>
            </div>

            <section className="px-4 pb-8" aria-labelledby="how-heading">
              <h2
                id="how-heading"
                className="font-display text-lg font-semibold tracking-tight mb-3"
              >
                How it works
              </h2>
              <ol className="grid gap-3 sm:grid-cols-3 text-sm">
                <li className="rounded-lg border border-border bg-muted/20 p-3">
                  <span className="text-xs font-semibold text-primary">1</span>
                  <p className="mt-1 text-foreground font-medium">Start in the editor</p>
                  <p className="text-muted-foreground mt-0.5">
                    Premise, arc, and beats — guided prompts in each step.
                  </p>
                </li>
                <li className="rounded-lg border border-border bg-muted/20 p-3">
                  <span className="text-xs font-semibold text-primary">2</span>
                  <p className="mt-1 text-foreground font-medium">Add visuals</p>
                  <p className="text-muted-foreground mt-0.5">
                    AI images, your uploads, or a mix — tuned to your story.
                  </p>
                </li>
                <li className="rounded-lg border border-border bg-muted/20 p-3">
                  <span className="text-xs font-semibold text-primary">3</span>
                  <p className="mt-1 text-foreground font-medium">Publish & share</p>
                  <p className="text-muted-foreground mt-0.5">
                    Public link, social preview, copy or native share from the story.
                  </p>
                </li>
              </ol>
            </section>

            <section className="px-4 pb-8" aria-labelledby="pillars-heading">
              <h2 id="pillars-heading" className="sr-only">
                What makes a strong StoryWall
              </h2>
              <div className="rounded-xl border border-border bg-muted/15 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Strong StoryWalls usually…
                </p>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <Crosshair className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      <span className="font-medium text-foreground">Clear premise</span> — the
                      point is obvious in seconds
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <History className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      <span className="font-medium text-foreground">Chronological arc</span> —
                      sequence matters, not random facts
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <ListOrdered className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      <span className="font-medium text-foreground">Tight beats</span> — often 6–12
                      panels; each earns its place
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <ImageIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      <span className="font-medium text-foreground">Meaningful images</span> —
                      visuals sharpen the story, not filler
                    </span>
                  </li>
                  <li className="flex gap-2 sm:col-span-2 lg:col-span-1">
                    <Share2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      <span className="font-medium text-foreground">Share impulse</span> —
                      useful, surprising, or worth passing on
                    </span>
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-border/60">
                  <Link
                    href="/guide/great-stories"
                    className="text-sm font-medium text-primary hover:underline underline-offset-4"
                  >
                    Read the full guide →
                  </Link>
                </div>
              </div>
            </section>

            {typeof process.env.NEXT_PUBLIC_FOUNDER_DEMO_URL === "string" &&
              process.env.NEXT_PUBLIC_FOUNDER_DEMO_URL.length > 0 && (
                <section className="px-4 pb-8" aria-labelledby="founder-demo-heading">
                  <h2 id="founder-demo-heading" className="sr-only">
                    Founder demo
                  </h2>
                  <div className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Founder demo
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 max-w-md">
                        Short walkthrough of building and sharing a StoryWall (Week 1 launch).
                      </p>
                    </div>
                    <a
                      href={process.env.NEXT_PUBLIC_FOUNDER_DEMO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 shrink-0 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      <Play className="w-4 h-4 fill-current" aria-hidden />
                      Watch demo
                    </a>
                  </div>
                </section>
              )}
          </TabsContent>
        </Tabs>
      </main>
      <ExperimentalBottomMenuBar />
    </div>
  );
}
