import { useState } from "react";
import { X, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useNavigate } from "react-router-dom";

interface StorySubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSignedIn: boolean;
}

export const StorySubmissionModal = ({
  isOpen,
  onClose,
  isSignedIn,
}: StorySubmissionModalProps) => {
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const navigate = useNavigate();
  const maxLength = 500;

  const handleSubmit = () => {
    if (!isSignedIn) {
      navigate("/auth");
      return;
    }
    // Handle story submission
    console.log("Story submitted:", { content, location });
    setContent("");
    setLocation("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Share Your Story</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Textarea
            placeholder="What weird/funny thing happened to you today?"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
            className="min-h-[200px] text-base resize-none"
          />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Character count: {content.length}/{maxLength}</span>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="w-4 h-4" />
              Share your location (optional)
            </label>
            <input
              type="text"
              placeholder="City/Region"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            />
          </div>

          {!isSignedIn ? (
            <div className="bg-secondary/50 p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-3">
                ⚠️ Sign in to post your story
              </p>
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => navigate("/auth")}
                  size="lg"
                >
                  Sign In to Post
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={content.length === 0}
                size="lg"
              >
                Post Story
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
