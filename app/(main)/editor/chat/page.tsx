"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

type SkeletonEvent = {
  year: number;
  month?: number;
  day?: number;
  title: string;
};

export default function ConversationalEditorChatPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { toast } = useToast();

  const [timelineName, setTimelineName] = useState("");
  const [timelineDescription, setTimelineDescription] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [maxEvents, setMaxEvents] = useState(12);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<SkeletonEvent[]>([]);
  const [sources, setSources] = useState<Array<{ name: string; url: string }>>([]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect=/editor/chat");
    }
  }, [isSignedIn, isLoaded, router]);

  const runSkeleton = async () => {
    if (!timelineName.trim() || !timelineDescription.trim()) {
      toast({
        title: "Add a name and description",
        description: "Both fields are required to propose milestones.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    setEvents([]);
    setSources([]);
    try {
      const res = await fetch("/api/ai/timeline-skeleton", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timelineName: timelineName.trim(),
          timelineDescription: timelineDescription.trim(),
          timeframe: timeframe.trim() || undefined,
          maxEvents,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || res.statusText);
      }
      setEvents(data.events || []);
      setSources(data.sources || []);
      if (!data.events?.length) {
        toast({
          title: "No milestones returned",
          description: "Try a broader description or different timeframe.",
        });
      }
    } catch (e: unknown) {
      toast({
        title: "Skeleton request failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />
      <Toaster />
      <main className="container mx-auto px-4 pt-20 pb-8 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-1" asChild>
            <Link href="/editor">
              <ArrowLeft className="w-4 h-4" aria-hidden />
              Back to classic editor
            </Link>
          </Button>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
            Beta — conversational builder
          </p>
          <h1 className="text-2xl font-display font-bold">Propose story beats</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Step 1 of the new flow: we only generate factual milestones (year + headline). Review them
            here; full descriptions and images will plug into the existing pipeline in a later ticket.
          </p>
        </div>

        <Card className="p-4 sm:p-6 space-y-4 mb-6">
          <div>
            <label className="text-sm font-medium" htmlFor="ce-name">
              Timeline name
            </label>
            <Input
              id="ce-name"
              className="mt-1"
              value={timelineName}
              onChange={(e) => setTimelineName(e.target.value)}
              placeholder="e.g. US–Iran nuclear diplomacy"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="ce-desc">
              Description / premise
            </label>
            <Textarea
              id="ce-desc"
              className="mt-1 min-h-[100px]"
              value={timelineDescription}
              onChange={(e) => setTimelineDescription(e.target.value)}
              placeholder="What should this timeline cover? Any must-include angles?"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="ce-time">
              Timeframe (optional)
            </label>
            <Input
              id="ce-time"
              className="mt-1"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              placeholder="e.g. 1979 to present"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="ce-max">
              Max milestones
            </label>
            <Input
              id="ce-max"
              type="number"
              min={1}
              max={40}
              className="mt-1 max-w-[120px]"
              value={maxEvents}
              onChange={(e) => setMaxEvents(Math.max(1, Math.min(40, parseInt(e.target.value, 10) || 12)))}
            />
          </div>
          <Button type="button" className="w-full sm:w-auto" disabled={loading} onClick={runSkeleton}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
                Researching…
              </>
            ) : (
              "Propose milestones"
            )}
          </Button>
        </Card>

        {events.length > 0 && (
          <Card className="p-4 sm:p-6">
            <h2 className="font-display font-semibold mb-3">Proposed skeleton</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              {events.map((ev, i) => (
                <li key={`${ev.year}-${i}-${ev.title.slice(0, 24)}`} className="text-foreground">
                  <span className="font-medium tabular-nums">
                    {ev.year}
                    {ev.month != null ? `-${String(ev.month).padStart(2, "0")}` : ""}
                    {ev.day != null ? `-${String(ev.day).padStart(2, "0")}` : ""}
                  </span>
                  {": "}
                  {ev.title}
                </li>
              ))}
            </ol>
            {sources.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Sources (from model)</p>
                <ul className="text-xs space-y-1 break-all">
                  {sources.map((s, i) => (
                    <li key={i}>
                      <a href={s.url} className="text-primary hover:underline" target="_blank" rel="noreferrer">
                        {s.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
