import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.toLowerCase().trim() || "";

    if (query.length === 0) {
      // Return popular hashtags if no query
      const popularHashtags = await getPopularHashtags(20);
      return NextResponse.json({ suggestions: popularHashtags });
    }

    // Get hashtags from existing timelines that match the query
    const matchingHashtags = await getMatchingHashtags(query, 10);

    // Generate additional suggestions based on common patterns
    const commonSuggestions = generateCommonSuggestions(query);

    // Combine and deduplicate
    const allSuggestions = [
      ...matchingHashtags,
      ...commonSuggestions.filter((s) => !matchingHashtags.includes(s)),
    ].slice(0, 10);

    return NextResponse.json({ suggestions: allSuggestions });
  } catch (error: any) {
    console.error("Error fetching hashtag suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}

async function getPopularHashtags(limit: number): Promise<string[]> {
  try {
    // Get all timelines with hashtags
    const timelines = await prisma.timeline.findMany({
      where: {
        hashtags: {
          isEmpty: false,
        },
      },
      select: {
        hashtags: true,
      },
      take: 1000, // Get a large sample
    });

    // Count hashtag frequency
    const hashtagCounts: Record<string, number> = {};
    timelines.forEach((timeline) => {
      timeline.hashtags.forEach((tag) => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    });

    // Sort by frequency and return top hashtags
    return Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag]) => tag);
  } catch (error) {
    console.error("Error getting popular hashtags:", error);
    return [];
  }
}

async function getMatchingHashtags(
  query: string,
  limit: number
): Promise<string[]> {
  try {
    const timelines = await prisma.timeline.findMany({
      where: {
        hashtags: {
          hasSome: [], // This will be filtered in application code
        },
      },
      select: {
        hashtags: true,
      },
      take: 500,
    });

    // Filter hashtags that start with or contain the query
    const matching: Set<string> = new Set();
    timelines.forEach((timeline) => {
      timeline.hashtags.forEach((tag) => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          matching.add(tag);
        }
      });
    });

    return Array.from(matching).slice(0, limit);
  } catch (error) {
    console.error("Error getting matching hashtags:", error);
    return [];
  }
}

function generateCommonSuggestions(query: string): string[] {
  // Common hashtag patterns based on query
  const suggestions: string[] = [];

  // If query is a single word, suggest variations
  if (query.length > 0 && !query.includes(" ")) {
    suggestions.push(query);
    
    // Add common suffixes
    const suffixes = ["history", "timeline", "events", "story", "facts"];
    suffixes.forEach((suffix) => {
      if (query !== suffix) {
        suggestions.push(`${query}${suffix}`);
      }
    });
  }

  // Common categories
  const categories = [
    "technology",
    "science",
    "history",
    "culture",
    "art",
    "sports",
    "politics",
    "business",
    "entertainment",
    "education",
  ];

  categories.forEach((cat) => {
    if (cat.includes(query) || query.includes(cat)) {
      suggestions.push(cat);
    }
  });

  return suggestions.slice(0, 5);
}

