"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Folder, Plus, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoryWallIcon } from "@/components/StoryWallIcon";

export const Header = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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
        <Link href="/" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
            <StoryWallIcon size={28} />
          </div>
          <span className="font-display font-bold text-xl text-foreground">StoryWall</span>
        </Link>

        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            // @ts-ignore - Type inference issue with class-variance-authority
            size="icon"
            className="h-8 w-8"
            // @ts-ignore - Type inference issue with asChild prop
            asChild
          >
            <Link href="/discover">
              <Search className="w-4 h-4" />
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            // @ts-ignore - Type inference issue with class-variance-authority
            size="icon"
            className="h-8 w-8"
            // @ts-ignore - Type inference issue with asChild prop
            asChild
          >
            <Link href="/portfolio">
              <Folder className="w-4 h-4" />
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            // @ts-ignore - Type inference issue with class-variance-authority
            size="icon"
            className="h-8 w-8"
            // @ts-ignore - Type inference issue with asChild prop
            asChild
          >
            <Link href="/editor">
              <Plus className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            // @ts-ignore - Type inference issue with class-variance-authority
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
    </header>
  );
};
