import { NextRequest, NextResponse } from "next/server";
import { getAIClient, createChatCompletion } from "@/lib/ai/client";
import {
  SKELETON_SYSTEM_PROMPT,
  buildSkeletonUserPrompt,
} from "@/lib/prompts/chat-skeleton";

export type TimelineSkeletonEvent = {
  year: number;
  month?: number;
  day?: number;
  title: string;
};

type SkeletonResponseBody = {
  events: TimelineSkeletonEvent[];
  sources?: Array<{ name: string; url: string }>;
};

function clampInt(n: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function normalizeEvents(raw: unknown): TimelineSkeletonEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: TimelineSkeletonEvent[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const year = typeof o.year === "number" ? o.year : parseInt(String(o.year), 10);
    if (!Number.isFinite(year)) continue;
    const title = typeof o.title === "string" ? o.title.trim() : "";
    if (!title) continue;
    const ev: TimelineSkeletonEvent = { year, title };
    if (typeof o.month === "number" && o.month >= 1 && o.month <= 12) ev.month = o.month;
    if (typeof o.day === "number" && o.day >= 1 && o.day <= 31) ev.day = o.day;
    out.push(ev);
  }
  return out;
}

function stripCodeFences(text: string): string {
  let t = text.trim();
  if (t.startsWith("```json")) t = t.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  else if (t.startsWith("```")) t = t.replace(/^```\s*/, "").replace(/\s*```$/, "");
  return t.trim();
}

/**
 * POST /api/ai/timeline-skeleton
 * Body: { timelineName, timelineDescription, timeframe?, maxEvents?, sourceRestrictions? }
 * Response: { events: [{ year, month?, day?, title }], sources? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      timelineName,
      timelineDescription,
      timeframe,
      maxEvents: rawMax,
      sourceRestrictions,
    } = body as Record<string, unknown>;

    if (
      typeof timelineName !== "string" ||
      typeof timelineDescription !== "string" ||
      !timelineName.trim() ||
      !timelineDescription.trim()
    ) {
      return NextResponse.json(
        { error: "timelineName and timelineDescription are required" },
        { status: 400 }
      );
    }

    let maxEvents = clampInt(
      typeof rawMax === "number" ? rawMax : parseInt(String(rawMax), 10),
      1,
      40,
      12
    );

    let client;
    try {
      client = getAIClient();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "AI not configured";
      return NextResponse.json({ error: msg }, { status: 503 });
    }

    const userPrompt = buildSkeletonUserPrompt({
      timelineName: timelineName.trim(),
      timelineDescription: timelineDescription.trim(),
      timeframe: typeof timeframe === "string" ? timeframe : undefined,
      maxEvents,
      sourceRestrictions:
        typeof sourceRestrictions === "string" ? sourceRestrictions : undefined,
    });

    const modelToUse =
      client.provider === "kimi" ? "kimi-k2-turbo-preview" : "gpt-4o-mini";
    const maxTokens = client.provider === "kimi" ? 6000 : 8000;

    const data = await createChatCompletion(client, {
      model: modelToUse,
      messages: [
        { role: "system", content: SKELETON_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.35,
      max_tokens: maxTokens,
      maxEvents,
    });

    const contentText = data.choices?.[0]?.message?.content;
    if (!contentText || typeof contentText !== "string") {
      return NextResponse.json(
        { error: "Empty response from model" },
        { status: 502 }
      );
    }

    let parsed: { events?: unknown; sources?: unknown };
    try {
      parsed = JSON.parse(stripCodeFences(contentText));
    } catch {
      const start = contentText.indexOf("{");
      if (start === -1) {
        return NextResponse.json(
          { error: "Model did not return valid JSON" },
          { status: 502 }
        );
      }
      parsed = JSON.parse(stripCodeFences(contentText.slice(start)));
    }

    const events = normalizeEvents(parsed.events).slice(0, maxEvents);
    let sources: SkeletonResponseBody["sources"];
    if (Array.isArray(parsed.sources)) {
      sources = parsed.sources
        .filter(
          (s): s is { name: string; url: string } =>
            s &&
            typeof s === "object" &&
            typeof (s as { name?: string }).name === "string" &&
            typeof (s as { url?: string }).url === "string"
        )
        .slice(0, 8);
    }

    const res: SkeletonResponseBody = { events };
    if (sources?.length) res.sources = sources;

    return NextResponse.json(res);
  } catch (err: unknown) {
    console.error("[timeline-skeleton]", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
