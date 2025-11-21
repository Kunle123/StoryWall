"use client";

import { Share2, Home, Plus, FileText, Sparkles, BarChart3, Twitter, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

type SelectedDateFormat = 
  | { type: 'numbered'; value: string }
  | { type: 'dated'; day: string | null; month: string | null; year: string; duration: string | null }
  | undefined;

interface ExperimentalBottomMenuBarProps {
  selectedDate?: SelectedDateFormat;
  timelinePosition?: number;
  startDate?: Date;
  endDate?: Date;
  isNumbered?: boolean;
  totalEvents?: number;
  onShareTwitterThread?: () => void;
  onShareTikTokSlideshow?: () => void;
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
  totalEvents = 0,
  onShareTwitterThread,
  onShareTikTokSlideshow
}: ExperimentalBottomMenuBarProps) => {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Detect keyboard open/close on mobile and input focus
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if any input/textarea is focused
    const checkInputFocus = (): boolean => {
      const activeElement = document.activeElement;
      if (!activeElement) return false;
      
      // Only consider actual input fields, not buttons or other interactive elements
      const isInputFocused = (
        activeElement.tagName === 'INPUT' &&
        (activeElement as HTMLInputElement).type !== 'button' &&
        (activeElement as HTMLInputElement).type !== 'submit' &&
        (activeElement as HTMLInputElement).type !== 'reset'
      ) || (
        activeElement.tagName === 'TEXTAREA'
      ) || (
        activeElement.getAttribute('contenteditable') === 'true' &&
        activeElement.tagName !== 'BUTTON'
      );
      return Boolean(isInputFocused);
    };

    // Use visual viewport API for better keyboard detection
    const handleResize = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        // If viewport height is significantly smaller than window height, keyboard is likely open
        // Use a larger threshold (200px) to avoid false positives
        const isKeyboardOpen = windowHeight - viewportHeight > 200;
        const inputFocused = checkInputFocus();
        // Only hide if both conditions are met: keyboard is open AND input is focused
        setIsKeyboardVisible(isKeyboardOpen && inputFocused);
      } else {
        // Fallback: detect if window resized significantly (mobile keyboard)
        const currentHeight = window.innerHeight;
        const screenHeight = window.screen.height;
        const isKeyboardOpen = screenHeight - currentHeight > 200;
        const inputFocused = checkInputFocus();
        // Only hide if both conditions are met
        setIsKeyboardVisible(isKeyboardOpen && inputFocused);
      }
    };

    // Check on focus/blur events for inputs
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      // Only set keyboard visible if it's actually an input field (not buttons)
      if (target && (
        (target.tagName === 'INPUT' && 
         (target as HTMLInputElement).type !== 'button' &&
         (target as HTMLInputElement).type !== 'submit' &&
         (target as HTMLInputElement).type !== 'reset') ||
        target.tagName === 'TEXTAREA' ||
        (target.getAttribute('contenteditable') === 'true' && target.tagName !== 'BUTTON')
      )) {
        // Check if viewport actually changed (keyboard appeared)
        setTimeout(() => {
          if (window.visualViewport) {
            const viewportHeight = window.visualViewport.height;
            const windowHeight = window.innerHeight;
            const isKeyboardOpen = windowHeight - viewportHeight > 200;
            setIsKeyboardVisible(isKeyboardOpen);
          } else {
            const currentHeight = window.innerHeight;
            const screenHeight = window.screen.height;
            const isKeyboardOpen = screenHeight - currentHeight > 200;
            setIsKeyboardVisible(isKeyboardOpen);
          }
        }, 300); // Delay to allow keyboard animation
      }
    };

    const handleBlur = () => {
      // Small delay to check if keyboard actually closed
      setTimeout(() => {
        if (window.visualViewport) {
          const viewportHeight = window.visualViewport.height;
          const windowHeight = window.innerHeight;
          const isKeyboardOpen = windowHeight - viewportHeight > 200;
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
  
  // Get duration from selectedDate if it's a dated event
  const durationFromDate = selectedDate?.type === 'dated' ? selectedDate.duration : null;
  
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
            {/* Orange border along upper edge (following the arc cutout) */}
            <path
              d={`
                M 0 0
                L ${arcLeftX} 0
                A ${recessRadius} ${recessRadius} 0 0 0 ${arcRightX} 0
                L ${screenWidth} 0
              `}
              fill="none"
              stroke="#FF6B35"
              strokeWidth="1"
              strokeOpacity="1"
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
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12"
                  onClick={handleShare}
                >
                  <Share2 className="w-10 h-10" />
                </Button>
                {onShareTwitterThread && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12"
                    onClick={() => {
                      const timelineId = window.location.pathname.split('/')[2];
                      if (timelineId) {
                        router.push(`/timeline/${timelineId}/share/twitter`);
                      }
                    }}
                  >
                    <Twitter className="w-10 h-10" />
                  </Button>
                )}
                {onShareTikTokSlideshow && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12"
                    onClick={() => {
                      const timelineId = window.location.pathname.split('/')[2];
                      if (timelineId) {
                        router.push(`/timeline/${timelineId}/share/tiktok`);
                      }
                    }}
                  >
                    <Music className="w-10 h-10" />
                  </Button>
                )}
              </div>
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
          onClick={() => {
            // If already on editor page, show create menu instead of navigating
            if (pathname === "/editor") {
              setShowCreateMenu(true);
            } else if (hasTimeline) {
              router.push("/editor");
            } else {
              setShowCreateMenu(true);
            }
          }}
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
                  selectedDate?.type === 'numbered' ? (
                    <div className="text-sm font-bold text-foreground text-center leading-tight">
                      {selectedDate.value}
                    </div>
                  ) : selectedDate?.type === 'dated' ? (
                    <>
                      {/* 3-line date format with fixed positions: day (top), month (middle), year (bottom) */}
                      <div className="flex flex-col items-center justify-center leading-tight" style={{ height: '48px' }}>
                        {/* Day - always in top position */}
                        <div className="text-[13px] font-bold text-foreground" style={{ height: '16px', lineHeight: '16px' }}>
                          {selectedDate.day || ''}
                        </div>
                        {/* Month - always in middle position */}
                        <div className="text-[11px] font-medium text-foreground/80" style={{ height: '14px', lineHeight: '14px' }}>
                          {selectedDate.month || ''}
                        </div>
                        {/* Year - always in bottom position */}
                        <div className="text-[13px] font-bold text-foreground" style={{ height: '16px', lineHeight: '16px' }}>
                          {selectedDate.year}
                        </div>
                      </div>
                      {/* Duration - fixed position in gap between arc */}
                      <div className="text-[10px] text-muted-foreground font-medium" style={{ marginTop: '4px', height: '12px', lineHeight: '12px' }}>
                        {durationFromDate || ''}
                      </div>
                    </>
                  ) : null
                ) : (
                  <Plus className="w-8 h-8 text-foreground" strokeWidth={3} />
                )}
              </div>
            </div>
      </div>

      {/* Create Menu Dialog */}
      <Dialog open={showCreateMenu} onOpenChange={setShowCreateMenu}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Timeline</DialogTitle>
            <DialogDescription>
              Choose how you'd like to create your timeline
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => {
                router.push("/editor");
                setShowCreateMenu(false);
              }}
            >
              <FileText className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Create Timeline</div>
                <div className="text-xs text-muted-foreground">
                  Build a custom timeline from scratch
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 opacity-50 cursor-not-allowed"
              disabled
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Sparkles className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Create Social Timeline</div>
                <div className="text-xs text-muted-foreground">
                  Use templates for social media content
                  <span className="ml-2 text-xs font-medium text-muted-foreground/70">(Coming Soon)</span>
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => {
                router.push("/statistics");
                setShowCreateMenu(false);
              }}
            >
              <BarChart3 className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Create Statistics Timeline</div>
                <div className="text-xs text-muted-foreground">
                  Visualize statistical data with charts
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

