"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoryWallIcon } from "@/components/StoryWallIcon";
import { useCredits } from "@/hooks/use-credits";
import { BuyCreditsModal } from "@/components/BuyCreditsModal";

interface HeaderProps {
  isVisible?: boolean; // Controlled visibility from parent (for timeline pages)
}

export const Header = ({ isVisible: controlledVisibility }: HeaderProps = {}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const { credits, fetchCredits } = useCredits();

  // Use controlled visibility if provided, otherwise use internal state
  const headerVisible = controlledVisibility !== undefined ? controlledVisibility : isVisible;

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  useEffect(() => {
    // Only handle window scroll if visibility is not controlled by parent
    if (controlledVisibility !== undefined) {
      return; // Parent controls visibility
    }

    const handleWindowScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down
        if (isVisible) {
          setIsVisible(false);
        }
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        if (!isVisible) {
          setIsVisible(true);
        }
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, [lastScrollY, isVisible, controlledVisibility]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 ease-in-out ${headerVisible ? 'translate-y-0' : '-translate-y-full'}`}>
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
