import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye, Trash2, Settings, LogOut, Plus, Globe, Lock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Timeline {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  views: number;
  isPublic: boolean;
}

const mockTimelines: Timeline[] = [
  {
    id: "1",
    title: "Automotive History",
    description: "A comprehensive timeline of major automotive innovations and milestones that shaped modern transportation.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    views: 5400,
    isPublic: true,
  },
  {
    id: "2",
    title: "Space Exploration",
    description: "Key moments in humanity's journey to explore the cosmos, from first satellites to Mars rovers.",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    views: 1890,
    isPublic: false,
  },
];

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSignedIn] = useState(true);
  const [timelines, setTimelines] = useState<Timeline[]>(mockTimelines);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [timelineToDelete, setTimelineToDelete] = useState<string | null>(null);
  const [updatingVisibility, setUpdatingVisibility] = useState<string | null>(null);

  const userName = "John Doe";
  const totalViews = timelines.reduce((sum, t) => sum + t.views, 0);

  const handleLogout = () => {
    toast({
      title: "Logged out successfully",
      description: "You have been signed out of your account",
    });
    navigate("/auth");
  };

  const handleToggleVisibility = async (timelineId: string) => {
    setUpdatingVisibility(timelineId);
    
    // Simulate API call
    setTimeout(() => {
      setTimelines(timelines.map(t => 
        t.id === timelineId ? { ...t, isPublic: !t.isPublic } : t
      ));
      setUpdatingVisibility(null);
      
      const timeline = timelines.find(t => t.id === timelineId);
      toast({
        title: "Visibility updated",
        description: `Timeline is now ${!timeline?.isPublic ? 'public' : 'private'}`,
      });
    }, 800);
  };

  const handleDeleteClick = (timelineId: string) => {
    setTimelineToDelete(timelineId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!timelineToDelete) return;
    
    // Simulate API call
    setTimeout(() => {
      setTimelines(timelines.filter(t => t.id !== timelineToDelete));
      setDeleteDialogOpen(false);
      setTimelineToDelete(null);
      
      toast({
        title: "Timeline deleted",
        description: "Your timeline has been permanently deleted",
      });
    }, 500);
  };

  const formatViews = (views: number) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`;
    }
    return views.toString();
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <div className="space-y-6">
            <Avatar className="w-20 h-20 mx-auto">
              <AvatarFallback className="text-4xl">👤</AvatarFallback>
            </Avatar>
            <h1 className="text-2xl sm:text-3xl font-bold font-display">Sign in to view your profile</h1>
            <p className="text-sm text-muted-foreground">
              Create an account to create timelines and track your activity
            </p>
            <Button size="lg" onClick={() => navigate("/auth")}>
              Sign In / Sign Up
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-16 pb-8 max-w-4xl">
        {/* Profile Header Card */}
        <Card className="p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src="" alt={userName} />
                <AvatarFallback className="text-4xl">👤</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold font-display mb-1">{userName}</h1>
                <p className="text-sm text-muted-foreground mb-2">
                  {timelines.length} timeline{timelines.length !== 1 ? 's' : ''} created
                </p>
                <div className="flex items-center gap-1.5 text-sm">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{formatViews(totalViews)}</span>
                  <span className="text-muted-foreground">total views</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => navigate("/timeline-editor")}>
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Timeline Creator</Badge>
            {timelines.length > 0 && (
              <Badge variant="secondary">{timelines.length} Timeline{timelines.length !== 1 ? 's' : ''}</Badge>
            )}
          </div>
        </Card>

        {/* Your Timelines Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display">Your Timelines</h2>
            <Button onClick={() => navigate("/timeline-editor")}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Timeline
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              Loading your timelines...
            </div>
          )}

          {/* Empty State */}
          {!isLoading && timelines.length === 0 && (
            <Card className="p-12 text-center">
              <div className="space-y-4">
                <div className="text-6xl">📅</div>
                <h3 className="text-xl font-bold font-display">No timelines yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Start creating beautiful timelines to showcase historical events, personal journeys, or project milestones.
                </p>
                <Button size="lg" onClick={() => navigate("/timeline-editor")}>
                  Create Your First Timeline
                </Button>
              </div>
            </Card>
          )}

          {/* Timeline Cards */}
          {!isLoading && timelines.map((timeline) => (
            <Card key={timeline.id} className="p-6 hover:shadow-lg transition-all">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold font-display mb-2">{timeline.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {timeline.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span>Created {formatDistance(timeline.createdAt)}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {formatViews(timeline.views)} views
                  </div>
                  <span>•</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent"
                    onClick={() => handleToggleVisibility(timeline.id)}
                    disabled={updatingVisibility === timeline.id}
                  >
                    <Badge variant="outline" className="gap-1.5 cursor-pointer hover:bg-secondary">
                      {updatingVisibility === timeline.id ? (
                        "Updating..."
                      ) : timeline.isPublic ? (
                        <>
                          <Globe className="w-3 h-3" />
                          Public
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" />
                          Private
                        </>
                      )}
                    </Badge>
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate("/")}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Timeline
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteClick(timeline.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Timeline</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this timeline? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function formatDistance(date: Date) {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export default Profile;
