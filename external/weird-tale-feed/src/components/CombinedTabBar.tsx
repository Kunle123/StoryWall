interface CombinedTabBarProps {
  title: string;
  selectedDate?: string;
  precedingDate?: string;
  followingDate?: string;
  timelinePosition?: number;
  startDate?: Date;
  endDate?: Date;
  headerVisible?: boolean;
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

export const CombinedTabBar = ({ 
  title, 
  selectedDate, 
  precedingDate, 
  followingDate, 
  timelinePosition = 0.5,
  startDate,
  endDate,
  headerVisible = true 
}: CombinedTabBarProps) => {
  // Calculate arc angles rotated 2° clockwise from 90° anti-clockwise (from -266° to +90°)
  const startAngle = -266;
  const endAngle = 90;
  const totalRange = endAngle - startAngle;
  const currentAngle = startAngle + totalRange * timelinePosition;
  
  // Arc positioned to match the circle's outer diameter
  const radius = 20; // Smaller radius for tab bar
  const centerX = 20;
  const centerY = 20;
  
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

  const dateRange = startDate && endDate ? formatDateRange(startDate, endDate) : null;
  const formattedStartDate = startDate ? startDate.getFullYear().toString() : null;
  const formattedEndDate = endDate ? endDate.getFullYear().toString() : null;

  return (
    <div className={`fixed left-0 right-0 z-40 backdrop-blur transition-all duration-300 ${
      headerVisible 
        ? 'top-12 bg-background/60 supports-[backdrop-filter]:bg-background/60' 
        : 'top-0 bg-background/60 supports-[backdrop-filter]:bg-background/60'
    }`} style={{
      height: '56px',
      borderBottom: '1px solid hsl(var(--border) / 0.5)'
    }}>
      <div className="container mx-auto px-4 h-full flex items-center gap-4 max-w-4xl">
        {/* Title */}
        <h2 className="font-display font-semibold text-sm truncate flex-shrink-0">
          {title}
        </h2>
        
        {/* Circular Widget */}
        <div className="flex items-center gap-3 flex-1 justify-center">
          <div className="rounded-full bg-muted/30 w-10 h-10 flex items-center justify-center relative overflow-hidden">
            {/* SVG Timeline Arc */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 40 40">
              {/* Background arc */}
              <path
                d={arcPath}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Active arc - from start to current position */}
              <path
                d={arcPath}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={totalArcLength}
                strokeDashoffset={totalArcLength - currentArcLength}
                style={{
                  transition: 'stroke-dashoffset 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)'
                }}
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <div className="text-[10px] font-semibold text-foreground text-center leading-tight">
                {selectedDate?.split(',')[0] || 'Timeline'}
              </div>
            </div>
          </div>
          
          {/* Date Information */}
          <div className="flex flex-col gap-0.5">
            {precedingDate && (
              <div className="text-[10px] font-medium text-muted-foreground leading-tight">
                {precedingDate.split(',')[0]}
              </div>
            )}
            {selectedDate && (
              <div className="text-xs font-semibold text-foreground leading-tight">
                {selectedDate}
              </div>
            )}
            {followingDate && (
              <div className="text-[10px] font-medium text-muted-foreground leading-tight">
                {followingDate.split(',')[0]}
              </div>
            )}
          </div>
        </div>
        
        {/* Date Range */}
        {formattedStartDate && formattedEndDate && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium flex-shrink-0">
            <span>{formattedStartDate}</span>
            <span>·</span>
            <span>{dateRange}</span>
            <span>·</span>
            <span>{formattedEndDate}</span>
          </div>
        )}
      </div>
    </div>
  );
};
