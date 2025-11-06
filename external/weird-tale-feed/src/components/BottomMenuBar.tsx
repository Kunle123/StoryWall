import { Share2, Layers, Home } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface BottomMenuBarProps {
  viewMode?: "vertical" | "hybrid";
  onViewModeChange?: (mode: "vertical" | "hybrid") => void;
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

export const BottomMenuBar = ({ 
  viewMode, 
  onViewModeChange,
  selectedDate,
  timelinePosition = 0.5,
  startDate,
  endDate
}: BottomMenuBarProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: "Timeline",
        text: "Check out this timeline",
        url: url,
      }).catch(() => {
        navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Timeline link copied to clipboard",
        });
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Timeline link copied to clipboard",
      });
    }
  };

  const handleToggleView = () => {
    if (onViewModeChange) {
      onViewModeChange(viewMode === "vertical" ? "hybrid" : "vertical");
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
  
  // Dynamic radius based on 20% of viewport width (min 40px, max 80px)
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

  // Calculate padding - 12px gap above and below dial
  const verticalPadding = 12;
  const dialTopPosition = verticalPadding;
  const contentTopPadding = dialTopPosition + dialSize + verticalPadding;
  
  // Create curved top edge following dial contour
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const screenCenterX = screenWidth / 2;
  const cutoutRadius = dialSize / 2 + verticalPadding; // Radius including padding
  const flatHeight = contentTopPadding + 56; // Total height of the bar
  const curveDepth = cutoutRadius * 2; // How high the curve goes
  
  // Calculate points for the curve - it should curve UP around the dial
  const leftCurveStart = screenCenterX - cutoutRadius;
  const rightCurveEnd = screenCenterX + cutoutRadius;
  const curveTop = flatHeight - curveDepth; // Top of the hump
  
  // SVG path: start bottom-left, go up to flat edge, curve UP around dial, continue flat, then down right side
  const clipPathValue = `path('M 0,${flatHeight} L 0,${flatHeight - 56} L ${leftCurveStart},${flatHeight - 56} A ${cutoutRadius},${cutoutRadius} 0 0 0 ${rightCurveEnd},${flatHeight - 56} L ${screenWidth},${flatHeight - 56} L ${screenWidth},${flatHeight} Z')`;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="relative" style={{ height: '110px', paddingTop: `${dialTopPosition}px` }}>
        <div className="container mx-auto px-4 h-full flex flex-col items-center justify-end max-w-4xl pb-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/50 rounded-t-3xl">
          <div className="w-full flex items-center justify-between gap-4 relative">
            {/* Left button with date */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-12 w-12"
                onClick={() => navigate("/discover")}
              >
                <Home className="w-7 h-7" />
              </Button>
              {formattedStartDate && (
                <div className="text-xs text-muted-foreground font-medium">
                  {formattedStartDate}
                </div>
              )}
            </div>

            {/* Center dial widget */}
            <div 
              className="rounded-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border flex items-center justify-center relative overflow-hidden"
              style={{ 
                width: `${dialSize}px`, 
                height: `${dialSize}px`,
                minWidth: `${dialSize}px`,
                minHeight: `${dialSize}px`
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
      </div>
    </div>
  );
};
