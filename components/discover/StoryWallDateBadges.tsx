"use client";

/**
 * High-contrast stacked labels on card imagery (primary + neutral). GitHub #30.
 */
export function StoryWallDateBadges({
  top,
  bottom,
  className = "",
}: {
  top: string;
  bottom: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-start gap-0 shadow-md pointer-events-none select-none max-w-[min(92%,15rem)] ${className}`}
    >
      <span className="px-2 py-1 bg-primary text-primary-foreground text-[0.62rem] sm:text-[0.65rem] font-bold uppercase tracking-wide leading-tight rounded-none">
        {top}
      </span>
      <span className="px-2 py-1 bg-background text-foreground border border-border border-t-0 text-[0.62rem] sm:text-[0.68rem] font-semibold leading-snug rounded-none line-clamp-2">
        {bottom}
      </span>
    </div>
  );
}
