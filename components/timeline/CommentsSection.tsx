"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send } from "lucide-react";
import { fetchCommentsByTimelineId, createComment, Comment } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface DisplayComment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timestamp: string;
  likes: number;
}

interface CommentsSectionProps {
  timelineId: string;
}

export const CommentsSection = ({ timelineId }: CommentsSectionProps) => {
  const [comments, setComments] = useState<DisplayComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();

  // Fetch comments on mount
  useEffect(() => {
    async function loadComments() {
      try {
        setLoading(true);
        const result = await fetchCommentsByTimelineId(timelineId);
        if (result.error) {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          });
        } else if (result.data) {
          const displayComments: DisplayComment[] = result.data.map((comment: Comment) => ({
            id: comment.id,
            author: comment.user?.username || "Anonymous",
            avatar: comment.user?.avatar_url,
            content: comment.content,
            timestamp: formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }),
            likes: comment.likes_count || 0,
          }));
          setComments(displayComments);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to load comments",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    if (timelineId) {
      loadComments();
    }
  }, [timelineId, toast]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const result = await createComment(timelineId, newComment.trim());
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.data) {
        // Add the new comment to the list
        const newDisplayComment: DisplayComment = {
          id: result.data.id,
          author: result.data.user?.username || "Anonymous",
          avatar: result.data.user?.avatar_url,
          content: result.data.content,
          timestamp: formatDistanceToNow(new Date(result.data.created_at), { addSuffix: true }),
          likes: result.data.likes_count || 0,
        };
        setComments([newDisplayComment, ...comments]);
        setNewComment("");
        toast({
          title: "Success",
          description: "Comment posted successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-lg">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment input */}
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src="" />
          <AvatarFallback>You</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-end">
            <Button 
              size="sm" 
              onClick={handleSubmit}
              disabled={!newComment.trim() || submitting}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {submitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">
            Loading comments...
          </p>
        ) : comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={comment.avatar} />
                <AvatarFallback>{comment.author[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-sm">{comment.author}</span>
                  <span className="text-xs text-muted-foreground">
                    {comment.timestamp}
                  </span>
                </div>
                <p className="text-sm text-foreground">{comment.content}</p>
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                  >
                    Like ({comment.likes})
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                  >
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

