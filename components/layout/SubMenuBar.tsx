"use client";

interface SubMenuBarProps {
  title: string;
}

export const SubMenuBar = ({ title }: SubMenuBarProps) => {
  return (
    <div className="fixed top-12 left-0 right-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-3 h-10 flex items-center max-w-4xl">
        <h2 className="font-display font-semibold text-base truncate">
          {title}
        </h2>
      </div>
    </div>
  );
};

