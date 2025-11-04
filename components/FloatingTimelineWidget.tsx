"use client";

interface FloatingTimelineWidgetProps {
  selectedDate?: string;
  precedingDate?: string;
  followingDate?: string;
  timelinePosition?: number;
}

export const FloatingTimelineWidget = ({ 
  selectedDate, 
  precedingDate, 
  followingDate, 
  timelinePosition = 0.5 
}: FloatingTimelineWidgetProps) => {
  // Calculate arc angles rotated 2° clockwise from 90° anti-clockwise (from -266° to +90°)
  const startAngle = -266;
  const endAngle = 90;
  const totalRange = endAngle - startAngle;
  const currentAngle = startAngle + totalRange * timelinePosition;
  
  // Arc positioned to match the circle's outer diameter
  const radius = 56; // Circle radius for 112px diameter
  const centerX = 56;
  const centerY = 56;
  
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const polarToCartesian = (angle: number) => ({
    x: centerX + radius * Math.cos(toRadians(angle)),
    y: centerY + radius * Math.sin(toRadians(angle))
  });
  
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  
  // Create full arc path (large arc flag = 1 for > 180°)
  const arcPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 1 1 ${end.x} ${end.y}`;
  
  // Calculate arc length for smooth animation
  const totalArcLength = (Math.abs(totalRange) * Math.PI * radius) / 180;
  const currentArcLength = (Math.abs(currentAngle - startAngle) * Math.PI * radius) / 180;

  return (
    <div className="fixed bottom-20 left-4 z-50 bg-background/80 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-border">
      <div className="w-28 h-28 rounded-full bg-muted/30 flex items-center justify-center relative overflow-hidden">
        {/* SVG Timeline Arc */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 112 112">
          {/* Background arc */}
          <path
            d={arcPath}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Active arc - from start to current position */}
          <path
            d={arcPath}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={totalArcLength}
            strokeDashoffset={totalArcLength - currentArcLength}
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)'
            }}
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 z-10 overflow-hidden">
          {precedingDate && (
            <div 
              key={`prev-${precedingDate}`}
              className="text-[13px] font-medium text-foreground/40 text-center leading-tight"
            >
              {precedingDate.split(',')[0]}
            </div>
          )}
          <div 
            key={`current-${selectedDate}`}
            className="text-[15px] font-semibold text-foreground text-center leading-tight"
          >
            {selectedDate?.split(',')[0] || 'Timeline'}
          </div>
          {followingDate && (
            <div 
              key={`next-${followingDate}`}
              className="text-[13px] font-medium text-foreground/40 text-center leading-tight"
            >
              {followingDate.split(',')[0]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

