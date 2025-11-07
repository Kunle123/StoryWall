"use client";

import { Share2, Home, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface ExperimentalBottomMenuBarProps {
  selectedDate?: string;
  timelinePosition?: number;
  startDate?: Date;
  endDate?: Date;
  isNumbered?: boolean;
  totalEvents?: number;
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
  endDate,
  isNumbered = false,
  totalEvents = 0
}: ExperimentalBottomMenuBarProps) => {
  const { toast } = useToast();
  const router = useRouter();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Detect keyboard open/close on mobile and input focus
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if any input/textarea is focused
    const checkInputFocus = () => {
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );
      return isInputFocused;
    };

    // Use visual viewport API for better keyboard detection
    const handleResize = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        // If viewport height is significantly smaller than window height, keyboard is likely open
        const isKeyboardOpen = windowHeight - viewportHeight > 150;
        const inputFocused = checkInputFocus();
        setIsKeyboardVisible(isKeyboardOpen || inputFocused);
      } else {
        // Fallback: detect if window resized significantly (mobile keyboard)
        const currentHeight = window.innerHeight;
        const screenHeight = window.screen.height;
        const isKeyboardOpen = screenHeight - currentHeight > 150;
        const inputFocused = checkInputFocus();
        setIsKeyboardVisible(isKeyboardOpen || inputFocused);
      }
    };

    // Check on focus/blur events for inputs
    const handleFocus = () => {
      setIsKeyboardVisible(true);
    };

    const handleBlur = () => {
      // Small delay to check if keyboard actually closed
      setTimeout(() => {
        if (window.visualViewport) {
          const viewportHeight = window.visualViewport.height;
          const windowHeight = window.innerHeight;
          const isKeyboardOpen = windowHeight - viewportHeight > 150;
          setIsKeyboardVisible(isKeyboardOpen);
        } else {
          setIsKeyboardVisible(false);
        }
      }, 100);
    };

    // Listen to visual viewport resize (best for keyboard detection)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    // Listen to input focus/blur
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    
    // Initial check
    handleResize();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

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

  // Check if there's a timeline component (has selectedDate)
  const hasTimeline = selectedDate !== undefined && selectedDate !== null;
  
  // Calculate arc angles for the dial (270-degree arc)
  const startAngle = -225;
  const endAngle = 45;
  const totalRange = endAngle - startAngle;
  // Clamp timelinePosition between 0 and 1 to prevent arc overflow
  // If no timeline, show full circle (100%)
  const clampedPosition = hasTimeline 
    ? Math.min(Math.max(timelinePosition, 0), 1)
    : 1; // Full circle when no timeline
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
  const dialCenterX = dialSize / 2;
  const dialCenterY = dialSize / 2;
  
  const polarToCartesian = (angle: number) => ({
    x: dialCenterX + radius * Math.cos(toRadians(angle)),
    y: dialCenterY + radius * Math.sin(toRadians(angle))
  });
  
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  
  const largeArcFlag = totalRange > 180 ? 1 : 0;
  const arcPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  
  const totalArcLength = (Math.abs(totalRange) * Math.PI * radius) / 180;
  const currentArcLength = (Math.abs(currentAngle - startAngle) * Math.PI * radius) / 180;

  const dateRange = startDate && endDate ? formatDateRange(startDate, endDate) : null;
  
  // For numbered timelines, show "1" and total count, for dated show start/end years
  const leftLabel = isNumbered ? "1" : (startDate ? startDate.getFullYear().toString() : null);
  const rightLabel = isNumbered ? totalEvents.toString() : (endDate ? endDate.getFullYear().toString() : null);

  // Calculate dial radius first (dialSize is diameter)
  const dialRadius = dialSize / 2;
  
  // Calculate recess size: 20px gap across the diameter
  // dialSize is the diameter, so recess diameter = dialSize + 20px
  const recessGap = 20; // Gap across diameter = 20px
  const recessSize = dialSize + recessGap; // Recess diameter = dialSize + 20px
  const recessRadius = recessSize / 2; // Recess radius = (dialSize + 20) / 2 = dialRadius + 10px
  
  // Tab bar height - 40px
  const tabBarHeight = 40;
  
  // Center position: The lowest point of the dial should be 30px above the bottom of the tab bar
  // Lowest point = center - dialRadius = 30px from bottom
  // Therefore: center = 30px + dialRadius from bottom
  // This also equals: 20px + recessRadius (since recessRadius = dialRadius + 10px)
  const centerYFromBottom = 30 + dialRadius; // Center at 30px + dialRadius from bottom

  // Generate unique mask ID
  const maskId = `tabBarMask-${Math.random().toString(36).substr(2, 9)}`;

  // Recess is contained within the 40px tab bar
  // Center is at centerYFromBottom from bottom of tab bar
  // SVG height matches tab bar height (40px), with y=0 at top, y=40 at bottom
  const svgTotalHeight = tabBarHeight;
  
  // Calculate screen center first
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const screenCenterX = screenWidth / 2;
  
  // Calculate where the recess circle intersects the top of the tab bar (y=0 in SVG)
  // The recess center is at centerYFromBottom = 90px from viewport bottom
  // In SVG coordinates: centerYInSVG = tabBarHeight - centerYFromBottom = 40 - 90 = -50
  // The circle has radius recessRadius = 70px, centered at (screenCenterX, -50)
  // At y=0 (top of tab bar), we need to find the x-coordinates where the circle intersects
  // Circle equation: (x - cx)^2 + (y - cy)^2 = r^2
  // At y=0: (x - screenCenterX)^2 + (0 - (-50))^2 = 70^2
  // (x - screenCenterX)^2 + 2500 = 4900
  // (x - screenCenterX)^2 = 2400
  // x - screenCenterX = ±sqrt(2400) = ±48.99
  const centerYInSVG = tabBarHeight - centerYFromBottom; // -50
  const yIntersect = 0; // Top of tab bar
  const distanceFromCenter = Math.abs(centerYInSVG - yIntersect); // 50
  const horizontalOffset = Math.sqrt(Math.max(0, recessRadius * recessRadius - distanceFromCenter * distanceFromCenter));
  const arcLeftX = screenCenterX - horizontalOffset;
  const arcRightX = screenCenterX + horizontalOffset;

  // Hide dial when keyboard is visible on mobile
  if (isKeyboardVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Container for both dial and tab bar */}
      <div className="relative">
        {/* Tab bar with circular recess at top center */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: `${tabBarHeight}px` }}>
          {/* Tab bar with circular cutout at top center */}
          <svg 
            className="absolute bottom-0 left-0 w-full pointer-events-none"
            style={{ height: `${tabBarHeight}px` }}
            viewBox={`0 0 ${screenWidth} ${tabBarHeight}`}
            preserveAspectRatio="none"
          >
            {/* Draw tab bar shape with circular arc cutout at top */}
            <path
              d={`
                M 0 ${tabBarHeight}
                L 0 0
                L ${arcLeftX} 0
                A ${recessRadius} ${recessRadius} 0 0 0 ${arcRightX} 0
                L ${screenWidth} 0
                L ${screenWidth} ${tabBarHeight}
                Z
              `}
              fill="hsl(var(--card))"
              fillOpacity="0.95"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeOpacity="0.8"
            />
          </svg>
          
          {/* Backdrop blur layer with same cutout shape (no background, just blur effect) */}
          <div 
            className="absolute bottom-0 left-0 right-0 backdrop-blur pointer-events-none"
            style={{ 
              height: `${tabBarHeight}px`,
              clipPath: `path('M 0 ${tabBarHeight} L 0 0 L ${arcLeftX} 0 A ${recessRadius} ${recessRadius} 0 0 0 ${arcRightX} 0 L ${screenWidth} 0 L ${screenWidth} ${tabBarHeight} Z')`
            }}
          />
          
          {/* Content - positioned at bottom of SVG, height matches tab bar */}
          <div className="container mx-auto px-4 flex items-center justify-between max-w-4xl relative z-10" style={{ height: `${tabBarHeight}px`, position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
            {/* Left button with date */}
            <div className="flex items-center gap-2 flex-1 justify-end" style={{ marginRight: 'calc(-20px + 20%)' }}>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-12 w-12"
                onClick={() => router.push("/")}
              >
                <Home className="w-10 h-10" />
              </Button>
              {leftLabel && (
                <div className="text-xs text-muted-foreground font-medium">
                  {leftLabel}
                </div>
              )}
            </div>

            {/* Center "Create" text - positioned lower in the tab bar */}
            <div className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-foreground z-20" style={{ bottom: `${tabBarHeight / 2 - 8}px`, transform: 'translate(-50%, 50%)' }}>
              Create
            </div>

            {/* Spacer for center dial area */}
            <div style={{ width: `${recessSize}px`, flexShrink: 0 }} />

            {/* Right button with date */}
            <div className="flex items-center gap-2 flex-1" style={{ marginLeft: 'calc(-20px + 20%)' }}>
              {rightLabel && (
                <div className="text-xs text-muted-foreground font-medium">
                  {rightLabel}
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12"
                onClick={handleShare}
              >
                <Share2 className="w-10 h-10" />
              </Button>
            </div>
          </div>
        </div>

        {/* Floating dial widget - floats above tab bar, center aligned with recess */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-card backdrop-blur supports-[backdrop-filter]:bg-card/95 border-2 border-border/80 shadow-lg flex items-center justify-center relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
          style={{ 
            width: `${dialSize}px`, 
            height: `${dialSize}px`,
            // Position dial floating above tab bar
            // Dial bottom at 30px from viewport bottom
            bottom: `30px`,
            minWidth: `${dialSize}px`,
            minHeight: `${dialSize}px`,
            zIndex: 50
          }}
          onClick={() => router.push("/editor")}
        >
              <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${dialSize} ${dialSize}`}>
                {/* Background arc */}
                <path
                  d={arcPath}
                  fill="none"
                  stroke="hsl(var(--muted-foreground) / 0.2)"
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
              
              {/* Content centered in dial - plus sign if no timeline, date if timeline exists */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-2">
                {hasTimeline ? (
                  <>
                    <div className="text-sm font-bold text-foreground text-center leading-tight">
                      {selectedDate}
                    </div>
                    {dateRange && (
                      <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                        {dateRange}
                      </div>
                    )}
                  </>
                ) : (
                  <Plus className="w-8 h-8 text-foreground" strokeWidth={3} />
                )}
              </div>
            </div>
      </div>
    </div>
  );
};

