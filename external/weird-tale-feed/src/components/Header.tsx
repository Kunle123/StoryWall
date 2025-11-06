import { User, Coins } from "lucide-react";
import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { StoryWallIcon } from "./StoryWallIcon";
import { useCredits } from "@/hooks/use-credits";
import { BuyCreditsModal } from "./BuyCreditsModal";

interface HeaderProps {
  onVisibilityChange?: (isVisible: boolean) => void;
}

export const Header = ({ onVisibilityChange }: HeaderProps = {}) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const { credits } = useCredits();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      const newIsVisible = currentScrollY <= lastScrollY || currentScrollY <= 80;
      
      if (newIsVisible !== isVisible) {
        setIsVisible(newIsVisible);
        onVisibilityChange?.(newIsVisible);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isVisible, onVisibilityChange]);

  return (
    <header className={`fixed top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="container mx-auto px-3 h-12 flex items-center justify-between max-w-4xl">
        <Link to="/discover" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
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
            onClick={() => setShowBuyCredits(true)}
          >
            <Coins className="w-4 h-4" />
            <span className="font-semibold">{credits}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => navigate("/profile")}
          >
            <User className="w-[18px] h-[18px]" />
          </Button>
        </div>
      </div>
      
      <BuyCreditsModal open={showBuyCredits} onOpenChange={setShowBuyCredits} />
    </header>
  );
};
