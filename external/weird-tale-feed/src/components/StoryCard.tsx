import { MessageCircle, Share2, MapPin, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { formatDistanceToNow } from "date-fns";

interface StoryCardProps {
  id: string;
  content: string;
  location?: string;
  createdAt: Date;
  reactions: number;
  comments: number;
  onClick?: () => void;
  onShare?: () => void;
}

export const StoryCard = ({
  content,
  location,
  createdAt,
  reactions,
  comments,
  onClick,
  onShare,
}: StoryCardProps) => {
  return (
    <Card
      className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30"
      onClick={onClick}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
          👤
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Anonymous</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
            </div>
            {location && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{location}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="text-foreground text-base leading-relaxed mb-4 whitespace-pre-wrap">
        {content}
      </p>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-primary"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          😂 {reactions}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-accent"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <MessageCircle className="w-4 h-4" />
          {comments}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-accent ml-auto"
          onClick={(e) => {
            e.stopPropagation();
            onShare?.();
          }}
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </div>
    </Card>
  );
};
