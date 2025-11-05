"use client";

interface SubMenuBarProps {
  title: string;
  selectedDate?: string;
  precedingDate?: string;
  followingDate?: string;
  timelinePosition?: number;
  headerVisible?: boolean;
}

export const SubMenuBar = ({ title, selectedDate, headerVisible = true }: SubMenuBarProps) => {
  return (
    <div 
      className={`fixed left-0 right-0 z-40 backdrop-blur transition-all duration-300 ease-in-out ${
        headerVisible 
          ? 'top-12 bg-background/60 supports-[backdrop-filter]:bg-background/60' 
          : 'top-0 bg-background/60 supports-[backdrop-filter]:bg-background/60'
      }`} 
      style={{
        height: '44px',
        borderBottom: '1px solid hsl(var(--border) / 0.5)',
        willChange: 'top'
      }}
    >
      <div className="container mx-auto px-3 h-full flex items-center gap-3 max-w-4xl">
        <h2 className="font-display font-semibold text-sm truncate flex-1">
          {title}
        </h2>
        {selectedDate && (
          <span className="text-xs font-medium text-muted-foreground hidden sm:block flex-shrink-0">
            {selectedDate}
          </span>
        )}
      </div>
    </div>
  );
};

