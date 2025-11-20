"use client";

import { useState } from "react";
import { TimelineEvent } from "./Timeline";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatEventDate } from "@/lib/utils/dateFormat";

interface TikTokSlideshowPreviewProps {
  events: TimelineEvent[];
  title?: string;
}

export const TikTokSlideshowPreview = ({ events, title }: TikTokSlideshowPreviewProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentEvent = events[currentIndex];

  if (!currentEvent) {
    return null;
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % events.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  const formatDate = (event: TimelineEvent) => {
    if (event.day && event.month && event.year) {
      return new Date(event.year, event.month - 1, event.day).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else if (event.month && event.year) {
      return new Date(event.year, event.month - 1).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    }
    return event.year ? formatEventDate(event.year, event.month, event.day) : '';
  };

  return (
    <div className="flex items-center justify-center min-h-[600px] bg-background p-4">
      <Card className="relative w-full max-w-[380px] bg-card overflow-hidden shadow-2xl">
        {/* TikTok 9:16 aspect ratio container */}
        <div className="relative" style={{ aspectRatio: "9/16" }}>
          {/* Main content area */}
          <div className="absolute inset-0 flex flex-col">
            {/* Header with timeline title */}
            {title && (
              <div className="bg-gradient-to-b from-background/95 to-transparent p-4 text-center z-10">
                <h2 className="text-lg font-bold text-foreground">{title}</h2>
              </div>
            )}

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
              {/* Image in 1:1 ratio */}
              <div className="w-full">
                <div
                  className="relative w-full rounded-lg overflow-hidden shadow-lg animate-fade-in"
                  style={{ aspectRatio: "1/1" }}
                >
                  {currentEvent.imageUrl || currentEvent.image ? (
                    <img
                      src={currentEvent.imageUrl || currentEvent.image}
                      alt={currentEvent.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <span className="text-6xl font-bold text-primary/30">
                        {currentEvent.year || '?'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Date badge */}
              {currentEvent.year && (
                <div className="flex justify-center animate-fade-in">
                  <div className="inline-flex items-center px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                    <span className="text-sm font-semibold text-primary">
                      {formatDate(currentEvent)}
                    </span>
                  </div>
                </div>
              )}

              {/* Title */}
              <div className="animate-fade-in">
                <h3 className="text-2xl font-bold text-foreground text-center mb-2">
                  {currentEvent.title}
                </h3>
                {currentEvent.category && (
                  <p className="text-sm text-muted-foreground text-center uppercase tracking-wide">
                    {currentEvent.category}
                  </p>
                )}
              </div>

              {/* Full Description */}
              {currentEvent.description && (
                <div className="animate-fade-in">
                  <p className="text-sm text-foreground/90 leading-relaxed text-justify">
                    {currentEvent.description}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation controls at bottom */}
            <div className="bg-gradient-to-t from-background/95 to-transparent p-4 z-10">
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPrevious}
                  disabled={events.length <= 1}
                  className="hover:scale-105 transition-transform"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Progress indicator */}
                <div className="flex-1">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {currentIndex + 1} / {events.length}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-out"
                      style={{
                        width: `${((currentIndex + 1) / events.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNext}
                  disabled={events.length <= 1}
                  className="hover:scale-105 transition-transform"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Dot indicators */}
              <div className="flex justify-center gap-1.5 mt-3">
                {events.slice(0, Math.min(events.length, 10)).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentIndex
                        ? "w-6 bg-primary"
                        : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
                {events.length > 10 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    +{events.length - 10}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

