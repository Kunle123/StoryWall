"use client";

import { useState } from "react";
import { Timeline } from "@/components/timeline/Timeline";
import { ukWarsTimeline } from "@/lib/data/timelineData";
import { Header } from "@/components/layout/Header";
import { BottomMenuBar } from "@/components/layout/BottomMenuBar";
import { Toaster } from "@/components/ui/toaster";

const UKWarsPage = () => {
  const [viewMode, setViewMode] = useState<"vertical" | "hybrid">("vertical");

  const formatDateRange = (events: typeof ukWarsTimeline) => {
    if (events.length === 0) return "";
    const sorted = [...events].sort((a, b) => a.year - b.year);
    const startYear = sorted[0].year;
    const endYear = sorted[sorted.length - 1].year;
    return `${startYear} - ${endYear}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster />
      <main className="container mx-auto px-3 pt-14 pb-0 max-w-6xl">
        <Timeline events={ukWarsTimeline} pixelsPerYear={15} viewMode={viewMode} onViewModeChange={setViewMode} />
      </main>
      <BottomMenuBar 
        title="UK Wars & Conflicts Timeline" 
        dateRange={formatDateRange(ukWarsTimeline)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </div>
  );
};

export default UKWarsPage;

