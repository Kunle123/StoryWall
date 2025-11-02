"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoryWallIcon } from "@/components/StoryWallIcon";
import { useCredits } from "@/hooks/use-credits";
import { BuyCreditsModal } from "@/components/BuyCreditsModal";

export const Header = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const { credits, fetchCredits } = useCredits();

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  useEffect(() => {
    let scrollableContainers: Element[] = [];
    let containerScrollPositions = new Map<Element, number>();

    const handleScroll = (scrollY: number, previousScrollY: number) => {
      const scrollDirection = scrollY > previousScrollY ? 'down' : 'up';
      
      if (scrollDirection === 'down' && scrollY > 80) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(scrollY);
    };

    // Handle window scroll (for pages without timeline)
    const handleWindowScroll = () => {
      const currentScrollY = window.scrollY;
      handleScroll(currentScrollY, lastScrollY);
    };

    // Handle scrollable container scroll (for timeline view)
    const handleContainerScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target) return;
      
      const previousScrollY = containerScrollPositions.get(target) || 0;
      const currentScrollY = target.scrollTop;
      containerScrollPositions.set(target, currentScrollY);
      
      handleScroll(currentScrollY, previousScrollY);
    };

    // Find all scrollable containers with overflow-y-auto (timeline containers)
    const findScrollableContainers = () => {
      const containers = document.querySelectorAll('.overflow-y-auto');
      containers.forEach((container) => {
        if (!scrollableContainers.includes(container)) {
          scrollableContainers.push(container);
          containerScrollPositions.set(container, container.scrollTop);
          container.addEventListener('scroll', handleContainerScroll, { passive: true });
        }
      });
    };

    // Initial find and periodic check for dynamically added containers
    findScrollableContainers();
    const containerCheckInterval = setInterval(findScrollableContainers, 500);

    // Listen to window scroll (fallback for non-timeline pages)
    window.addEventListener('scroll', handleWindowScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      scrollableContainers.forEach((container) => {
        container.removeEventListener('scroll', handleContainerScroll);
      });
      clearInterval(containerCheckInterval);
      containerScrollPositions.clear();
    };
  }, [lastScrollY]);

  return (
    <header className={`fixed top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="container mx-auto px-3 h-12 flex items-center justify-between max-w-4xl">
        <Link href="/discover" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <StoryWallIcon size={34} />
          </div>
          <span className="font-display font-bold text-xl text-foreground">StoryWall</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => {
              setShowBuyCredits(true);
            }}
            data-buy-credits
          >
            <Coins className="w-4 h-4" />
            <span className="font-semibold">{credits}</span>
          </Button>
          
          <Button
            variant="ghost"
            // @ts-ignore - Type inference issue with class-variance-authority
            size="icon"
            className="h-8 w-8 rounded-full"
            // @ts-ignore - Type inference issue with asChild prop
            asChild
          >
            <Link href="/profile">
              <User className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
      
      <BuyCreditsModal 
        open={showBuyCredits} 
        onOpenChange={(open) => {
          setShowBuyCredits(open);
          // Refresh credits when modal closes (in case purchase was made)
          if (!open) {
            fetchCredits();
          }
        }} 
      />
    </header>
  );
};
