import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Tag, X, Heart, Share2, UserPlus, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { carTimelineEvents } from "@/data/timelineData";
import { CommentsSection } from "@/components/CommentsSection";
import { FloatingTimelineWidget } from "@/components/FloatingTimelineWidget";
import { useState, useEffect } from "react";

const Story = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likes, setLikes] = useState(248);
  const [shares, setShares] = useState(64);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  
  const event = carTimelineEvents.find(e => e.id === id);
  const currentIndex = carTimelineEvents.findIndex(e => e.id === id);
  const hasNext = currentIndex < carTimelineEvents.length - 1;
  const hasPrev = currentIndex > 0;

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && hasNext) {
      navigate(`/story/${carTimelineEvents[currentIndex + 1].id}`);
    }
    if (isRightSwipe && hasPrev) {
      navigate(`/story/${carTimelineEvents[currentIndex - 1].id}`);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      setSlideDirection('left');
      setTimeout(() => navigate(`/story/${carTimelineEvents[currentIndex + 1].id}`), 50);
    }
  };

  const goToPrev = () => {
    if (hasPrev) {
      setSlideDirection('right');
      setTimeout(() => navigate(`/story/${carTimelineEvents[currentIndex - 1].id}`), 50);
    }
  };

  useEffect(() => {
    setSlideDirection(null);
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mock comments data
  const mockComments = [
    {
      id: "1",
      author: "TimelineEnthusiast",
      content: "This is such an important moment in history! Thanks for documenting this.",
      timestamp: "2 hours ago",
      likes: 12,
    },
    {
      id: "2", 
      author: "HistoryBuff",
      content: "Great details on this event. Would love to see more like this.",
      timestamp: "5 hours ago",
      likes: 8,
    },
  ];

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 pt-12 pb-8 max-w-4xl">
          <Button
            variant="ghost"
            className="mb-6 gap-2"
            onClick={() => navigate("/")}
          >
            <X className="w-4 h-4" />
            Back to Timeline
          </Button>
          <Card className="p-8 text-center">
            <h2 className="text-xl font-bold font-display mb-2">Event Not Found</h2>
            <p className="text-sm text-muted-foreground">This timeline event does not exist.</p>
          </Card>
        </main>
      </div>
    );
  }

  const formatDate = (year: number, month?: number, day?: number) => {
    if (day && month) {
      return new Date(year, month - 1, day).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    if (month) {
      return new Date(year, month - 1).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
    }
    return year.toString();
  };

  // Widget data
  const selectedDate = formatDate(event.year, event.month, event.day);
  const precedingDate = hasPrev ? formatDate(carTimelineEvents[currentIndex - 1].year, carTimelineEvents[currentIndex - 1].month, carTimelineEvents[currentIndex - 1].day) : undefined;
  const followingDate = hasNext ? formatDate(carTimelineEvents[currentIndex + 1].year, carTimelineEvents[currentIndex + 1].month, carTimelineEvents[currentIndex + 1].day) : undefined;
  const timelinePosition = carTimelineEvents.length > 1 ? currentIndex / (carTimelineEvents.length - 1) : 0.5;
  
  // Calculate start and end dates for the timeline
  const startEvent = carTimelineEvents[0];
  const endEvent = carTimelineEvents[carTimelineEvents.length - 1];
  const startDate = new Date(startEvent.year, (startEvent.month || 1) - 1, startEvent.day || 1);
  const endDate = new Date(endEvent.year, (endEvent.month || 12) - 1, endEvent.day || 31);

  return (
    <div className="min-h-screen bg-background">
      <FloatingTimelineWidget
        selectedDate={selectedDate}
        precedingDate={precedingDate}
        followingDate={followingDate}
        timelinePosition={timelinePosition}
        collapsed={isScrolled}
        startDate={startDate}
        endDate={endDate}
      />

      <main className="container mx-auto px-0 md:px-4 pt-4 pb-8 max-w-4xl">
        {/* Single Unified Card */}
        <Card 
          key={id}
          className={`relative p-6 md:p-8 rounded-none md:rounded-lg transition-all duration-300 ${
            slideDirection === 'left' ? 'animate-slide-out-left' : 
            slideDirection === 'right' ? 'animate-slide-out-right' : 
            'animate-slide-in'
          }`}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Navigation buttons for tablet and desktop */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg hover:bg-background disabled:opacity-30"
            onClick={goToPrev}
            disabled={!hasPrev}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg hover:bg-background disabled:opacity-30"
            onClick={goToNext}
            disabled={!hasNext}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-20 h-8 w-8 rounded-full hover:bg-muted"
            onClick={() => navigate("/")}
          >
            <X className="w-5 h-5" />
          </Button>

          {/* User Profile and Follow Button */}
          <div className="flex items-center justify-between mb-3 pr-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-primary">TC</span>
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">Timeline Creator</p>
                <p className="text-xs text-muted-foreground">@historian</p>
              </div>
            </div>
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              className="rounded-full h-7 px-3 text-xs font-bold"
              onClick={() => setIsFollowing(!isFollowing)}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </div>

          {/* Multimedia Content */}
          {(event.image || event.video) && (
            <div className="mb-3 rounded-lg overflow-hidden border border-border">
              {event.image && (
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="w-full h-auto max-h-[500px] object-cover"
                />
              )}
              {event.video && (
                <video 
                  src={event.video}
                  controls
                  className="w-full h-auto max-h-[500px]"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}
          
          <h1 className="text-2xl sm:text-3xl font-bold font-display mb-3">{event.title}</h1>

          {event.description && (
            <p className="text-base mb-3">
              {event.description}
            </p>
          )}

          {/* Date and Category */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
            <span className="text-sm text-muted-foreground">
              {formatDate(event.year, event.month, event.day)}
            </span>
            {event.category && (
              <>
                <span className="text-muted-foreground">·</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    event.category === "vehicle"
                      ? "bg-primary/10 text-primary"
                      : event.category === "crisis"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-accent/10 text-accent"
                  }`}
                >
                  {event.category}
                </span>
              </>
            )}
          </div>

          {/* Social Actions */}
          <div className="flex items-center gap-12 py-3 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 h-auto p-0 hover:text-pink-600 transition-colors ${isLiked ? "text-pink-600" : "text-muted-foreground"}`}
              onClick={() => {
                setIsLiked(!isLiked);
                setLikes(isLiked ? likes - 1 : likes + 1);
              }}
            >
              <Heart className={`w-[18px] h-[18px] ${isLiked ? "fill-current" : ""}`} />
              <span className="text-sm">{likes}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 h-auto p-0 text-muted-foreground hover:text-primary transition-colors">
              <MessageCircle className="w-[18px] h-[18px]" />
              <span className="text-sm">{mockComments.length}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 h-auto p-0 text-muted-foreground hover:text-green-600 transition-colors">
              <Share2 className="w-[18px] h-[18px]" />
              <span className="text-sm">{shares}</span>
            </Button>
          </div>

          {/* Comments Section */}
          <div className="pt-0">
            <CommentsSection comments={mockComments} />
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Story;
