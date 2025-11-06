"use client";

import { Share2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface ExperimentalBottomMenuBarProps {
  selectedDate?: string;
  timelinePosition?: number;
  startDate?: Date;
  endDate?: Date;
}

const formatDateRange = (startDate: Date, endDate: Date): string => {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffHours < 24) {
    return `${diffHours}h`;
  } else if (diffDays < 30) {
    return `${diffDays}d`;
  } else if (diffMonths < 12) {
    return `${diffMonths}mo`;
  } else {
    return `${diffYears}y`;
  }
};

export const ExperimentalBottomMenuBar = ({ 
  selectedDate,
  timelinePosition = 0.5,
  startDate,
  endDate
}: ExperimentalBottomMenuBarProps) => {
  const { toast } = useToast();
  const router = useRouter();

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Timeline",
          text: "Check out this timeline",
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Timeline link copied to clipboard",
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(url);
          toast({
            title: "Link copied!",
            description: "Timeline link copied to clipboard",
          });
        } catch (clipboardError) {
          toast({
            title: "Failed to share",
            description: "Please try copying the link manually",
            variant: "destructive",
          });
        }
      }
    }
  };

  // Calculate arc angles for the dial (270-degree arc)
  const startAngle = -225;
  const endAngle = 45;
  const totalRange = endAngle - startAngle;
  // Clamp timelinePosition between 0 and 1 to prevent arc overflow
  const clampedPosition = Math.min(Math.max(timelinePosition, 0), 1);
  const currentAngle = startAngle + totalRange * clampedPosition;
  
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  
  // Dynamic radius based on 20% of viewport width (min 80px, max 120px)
  const getDialSize = () => {
    if (typeof window !== 'undefined') {
      const vw20 = window.innerWidth * 0.2;
      return Math.min(Math.max(vw20, 80), 120);
    }
    return 80;
  };
  
  const dialSize = getDialSize();
  const radius = dialSize / 2 - 6;
  const centerX = dialSize / 2;
  const centerY = dialSize / 2;
  
  const polarToCartesian = (angle: number) => ({
    x: centerX + radius * Math.cos(toRadians(angle)),
    y: centerY + radius * Math.sin(toRadians(angle))
  });
  
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  
  const largeArcFlag = totalRange > 180 ? 1 : 0;
  const arcPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  
  const totalArcLength = (Math.abs(totalRange) * Math.PI * radius) / 180;
  const currentArcLength = (Math.abs(currentAngle - startAngle) * Math.PI * radius) / 180;

  const dateRange = startDate && endDate ? formatDateRange(startDate, endDate) : null;
  const formattedStartDate = startDate ? startDate.getFullYear().toString() : null;
  const formattedEndDate = endDate ? endDate.getFullYear().toString() : null;

  // Calculate recess size (slightly larger than dial)
  const recessPadding = 8; // Gap between dial and recess edge
  const recessSize = dialSize + (recessPadding * 2);
  const recessRadius = recessSize / 2;
  
  // Tab bar height
  const tabBarHeight = 64;
  const dialVerticalOffset = 12; // How much dial extends above tab bar

  // Calculate SVG path for tab bar with circular recess
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const centerX = screenWidth / 2;
  const leftStart = centerX - recessRadius;
  const rightEnd = centerX + recessRadius;
  const cornerRadius = 24; // Rounded top corners
  
  // SVG path: rectangle with circular cutout at top center
  const tabBarPath = `
    M 0,${tabBarHeight}
    L 0,${cornerRadius}
    Q 0,0 ${cornerRadius},0
    L ${leftStart},0
    A ${recessRadius},${recessRadius} 0 0 1 ${rightEnd},0
    L ${screenWidth - cornerRadius},0
    Q ${screenWidth},0 ${screenWidth},${cornerRadius}
    L ${screenWidth},${tabBarHeight}
    Z
  `;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="relative" style={{ height: `${tabBarHeight + dialVerticalOffset}px` }}>
        {/* Rectangular tab bar with circular recess using SVG */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: `${tabBarHeight + recessRadius}px` }}>
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            <defs>
              <filter id="backdrop-blur">
                <feGaussianBlur in="SourceGraphic" stdDeviation="10"/>
              </filter>
            </defs>
            <path
              d={tabBarPath}
              fill="hsl(var(--background) / 0.95)"
              className="backdrop-blur supports-[backdrop-filter]:bg-background/60"
            />
            <path
              d={tabBarPath}
              fill="none"
              stroke="hsl(var(--border) / 0.5)"
              strokeWidth="1"
            />
          </svg>
          
          {/* Content */}
          <div className="container mx-auto px-4 h-full flex items-center justify-between max-w-4xl relative z-10" style={{ height: `${tabBarHeight}px` }}>
            {/* Left button with date */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-12 w-12"
                onClick={() => router.push("/")}
              >
                <Home className="w-7 h-7" />
              </Button>
              {formattedStartDate && (
                <div className="text-xs text-muted-foreground font-medium">
                  {formattedStartDate}
                </div>
              )}
            </div>

            {/* Spacer for center dial area */}
            <div style={{ width: `${recessSize}px`, flexShrink: 0 }} />

            {/* Right button with date */}
            <div className="flex items-center gap-2 flex-1">
              {formattedEndDate && (
                <div className="text-xs text-muted-foreground font-medium">
                  {formattedEndDate}
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12"
                onClick={handleShare}
              >
                <Share2 className="w-7 h-7" />
              </Button>
            </div>
          </div>
        </div>

        {/* Center dial widget - positioned in the recess */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border flex items-center justify-center relative overflow-hidden"
          style={{ 
            width: `${dialSize}px`, 
            height: `${dialSize}px`,
            bottom: `${tabBarHeight - recessRadius + recessPadding}px`, // Position dial in the recess
            minWidth: `${dialSize}px`,
            minHeight: `${dialSize}px`,
            zIndex: 20
          }}
        >
              <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${dialSize} ${dialSize}`}>
                {/* Background arc */}
                <path
                  d={arcPath}
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* Active arc */}
                <path
                  d={arcPath}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={totalArcLength}
                  strokeDashoffset={totalArcLength - currentArcLength}
                  style={{
                    transition: 'stroke-dashoffset 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))'
                  }}
                />
              </svg>
              
              {/* Horizontal rectangle inside dial (slightly above center) */}
              <div 
                className="absolute z-10 bg-foreground/20 border border-foreground/30 rounded-sm"
                style={{
                  width: `${dialSize * 0.55}px`,
                  height: `${dialSize * 0.14}px`,
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -65%)', // Slightly above center
                }}
              />
              
              {/* Date text below the rectangle */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-2" style={{ paddingTop: `${dialSize * 0.15}px` }}>
                <div className="text-sm font-bold text-foreground text-center leading-tight">
                  {selectedDate || 'Timeline'}
                </div>
                {dateRange && (
                  <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                    {dateRange}
                  </div>
                )}
              </div>
            </div>
      </div>
    </div>
  );
};

