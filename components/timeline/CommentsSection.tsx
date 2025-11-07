"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, Heart } from "lucide-react";
import { fetchCommentsByTimelineId, fetchCommentsByEventId, createComment, createEventComment, Comment, fetchCommentLikeStatus, likeComment, unlikeComment } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface DisplayComment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  parentId?: string;
  replies?: DisplayComment[];
}

interface CommentsSectionProps {
  timelineId?: string;
  eventId?: string;
}

export const CommentsSection = ({ timelineId, eventId }: CommentsSectionProps) => {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [comments, setComments] = useState<DisplayComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [likingComments, setLikingComments] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Fetch comments on mount (only if signed in)
  useEffect(() => {
    async function loadComments() {
      // Only load comments if user is signed in
      if (!isSignedIn) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = eventId 
          ? await fetchCommentsByEventId(eventId)
          : timelineId 
          ? await fetchCommentsByTimelineId(timelineId)
          : { error: 'No timeline or event ID provided' };
          
        if (result.error) {
          // Don't show toast for errors, just log
          console.error('[Comments] Failed to load:', result.error);
        } else if (result.data) {
          // Fetch like status for all comments and replies
          const displayCommentsPromises = result.data.map(async (comment: Comment) => {
            const likeStatus = await fetchCommentLikeStatus(comment.id);
            const repliesPromises = (comment.replies || []).map(async (reply: Comment) => {
              const replyLikeStatus = await fetchCommentLikeStatus(reply.id);
              return {
                id: reply.id,
                author: reply.user?.username || "Anonymous",
                avatar: reply.user?.avatar_url,
                content: reply.content,
                timestamp: formatDistanceToNow(new Date(reply.created_at), { addSuffix: true }),
                likes: replyLikeStatus.data?.likes_count || reply.likes_count || 0,
                isLiked: replyLikeStatus.data?.user_liked || false,
                parentId: reply.parent_id,
              };
            });
            const replies = await Promise.all(repliesPromises);
            
            return {
              id: comment.id,
              author: comment.user?.username || "Anonymous",
              avatar: comment.user?.avatar_url,
              content: comment.content,
              timestamp: formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }),
              likes: likeStatus.data?.likes_count || comment.likes_count || 0,
              isLiked: likeStatus.data?.user_liked || false,
              parentId: comment.parent_id,
              replies,
            };
          });
          
          const displayComments = await Promise.all(displayCommentsPromises);
          setComments(displayComments);
        }
      } catch (error: any) {
        console.error('[Comments] Exception loading comments:', error);
      } finally {
        setLoading(false);
      }
    }

    if (timelineId || eventId) {
      loadComments();
    }
  }, [timelineId, eventId, isSignedIn]);

  const handleSubmit = async () => {
    // Check if we have content (either new comment or reply)
    const contentToCheck = replyingTo ? replyContent : newComment;
    if (!contentToCheck.trim()) return;

    // Check authentication
    if (!isSignedIn) {
      toast({
        title: "Sign in required",
        description: "Please sign in to post a comment",
        variant: "destructive",
      });
      router.push("/auth");
      return;
    }

    try {
      setSubmitting(true);
      const content = replyingTo ? replyContent.trim() : newComment.trim();
      const parentId = replyingTo || undefined;
      
      console.log('[Comments] Submitting comment:', { timelineId, eventId, parentId, contentLength: content.length });
      const result = eventId
        ? await createEventComment(eventId, content, parentId)
        : timelineId
        ? await createComment(timelineId, content, parentId)
        : { error: 'No timeline or event ID provided' };
      
      console.log('[Comments] Comment result:', result);
      
      if (result.error) {
        console.error('[Comments] Error creating comment:', result.error);
        toast({
          title: "Error",
          description: result.error === 'Unauthorized' 
            ? 'Please sign in to post a comment' 
            : result.error || 'Failed to post comment',
          variant: "destructive",
        });
        
        // If unauthorized, redirect to sign in
        if (result.error === 'Unauthorized') {
          router.push("/auth");
        }
      } else if (result.data) {
        // Add the new comment to the list
        const newDisplayComment: DisplayComment = {
          id: result.data.id,
          author: result.data.user?.username || user?.firstName || "Anonymous",
          avatar: result.data.user?.avatar_url || user?.imageUrl,
          content: result.data.content,
          timestamp: formatDistanceToNow(new Date(result.data.created_at), { addSuffix: true }),
          likes: result.data.likes_count || 0,
        };
        if (replyingTo) {
          // Add reply to the parent comment
          setComments(comments.map(c => 
            c.id === replyingTo 
              ? { ...c, replies: [...(c.replies || []), newDisplayComment] }
              : c
          ));
          setReplyContent("");
          setReplyingTo(null);
        } else {
          setComments([newDisplayComment, ...comments]);
          setNewComment("");
        }
        toast({
          title: "Success",
          description: replyingTo ? "Reply posted successfully" : "Comment posted successfully",
        });
      }
    } catch (error: any) {
      console.error('[Comments] Exception creating comment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // If not signed in, show sign-in prompt instead of comments
  if (!isSignedIn) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-lg">
            Comments
        </h3>
        </div>
        <div className="p-6 border border-border rounded-lg bg-muted/30 text-center">
          <MessageCircle className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">Sign in to view and post comments</p>
          <p className="text-xs text-muted-foreground mb-4">
            Join the conversation and share your thoughts
          </p>
          <Button 
            onClick={() => router.push("/auth")}
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Comment input */}
      <div className="flex gap-3 py-4">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={user?.imageUrl} />
          <AvatarFallback className="text-sm">{user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder="Post your reply"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className="min-h-[100px] resize-none border-0 p-0 text-[15px] placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <div className="flex justify-end mt-3">
            <Button 
              size="sm" 
              onClick={handleSubmit}
              disabled={!newComment.trim() || submitting}
              className="rounded-full h-9 px-4 text-[15px] font-bold"
            >
              {submitting ? "Posting..." : "Reply"}
            </Button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div>
        {loading ? (
          <p className="text-center text-muted-foreground py-8 text-[15px]">
            Loading comments...
          </p>
        ) : comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-[15px]">
            No comments yet. Be the first to reply!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 py-4 border-t border-border">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={comment.avatar} />
                <AvatarFallback className="text-sm">{comment.author[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-bold text-[15px]">{comment.author}</span>
                  <span className="text-[15px] text-muted-foreground">·</span>
                  <span className="text-[15px] text-muted-foreground">
                    {comment.timestamp}
                  </span>
                </div>
                <p className="text-[15px] leading-[20px] mb-2">{comment.content}</p>
                <div className="flex items-center gap-8">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-auto p-0 gap-2 transition-colors ${
                      comment.isLiked 
                        ? 'text-pink-600 hover:text-pink-700' 
                        : 'text-muted-foreground hover:text-pink-600'
                    }`}
                    onClick={async () => {
                      if (!isSignedIn) {
                        toast({
                          title: "Sign in required",
                          description: "Please sign in to like comments",
                          variant: "destructive",
                        });
                        router.push("/auth");
                        return;
                      }
                      
                      if (likingComments.has(comment.id)) return;
                      
                      setLikingComments(prev => new Set(prev).add(comment.id));
                      try {
                        const result = comment.isLiked 
                          ? await unlikeComment(comment.id)
                          : await likeComment(comment.id);
                        
                        if (result.error) {
                          toast({
                            title: "Error",
                            description: result.error,
                            variant: "destructive",
                          });
                        } else if (result.data) {
                          // Update the comment's like status
                          const resultData = result.data;
                          setComments(prevComments => 
                            prevComments.map(c => 
                              c.id === comment.id
                                ? { ...c, likes: resultData.likes_count, isLiked: resultData.user_liked }
                                : c
                            )
                          );
                        }
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: error.message || "Failed to update like",
                          variant: "destructive",
                        });
                      } finally {
                        setLikingComments(prev => {
                          const next = new Set(prev);
                          next.delete(comment.id);
                          return next;
                        });
                      }
                    }}
                    disabled={likingComments.has(comment.id)}
                  >
                    <Heart className={`w-[18px] h-[18px] ${comment.isLiked ? 'fill-current' : ''}`} />
                    <span className="text-[13px]">{comment.likes}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-[13px] text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setReplyingTo(comment.id)}
                  >
                    Reply
                  </Button>
                </div>
                {/* Reply input (shown when replying to this comment) */}
                {replyingTo === comment.id && (
                  <div className="mt-3 ml-12 flex gap-2">
                    <Textarea
                      placeholder={`Reply to ${comment.author}...`}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[80px] resize-none text-[15px]"
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={!replyContent.trim() || submitting}
                        className="rounded-full h-9 px-4 text-[15px] font-bold"
                      >
                        {submitting ? "Posting..." : "Reply"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent("");
                        }}
                        className="h-9 px-4 text-[13px]"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 ml-12 space-y-3 border-l-2 border-border pl-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-3">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={reply.avatar} />
                          <AvatarFallback className="text-xs">{reply.author[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-bold text-[14px]">{reply.author}</span>
                            <span className="text-[14px] text-muted-foreground">·</span>
                            <span className="text-[14px] text-muted-foreground">
                              {reply.timestamp}
                            </span>
                          </div>
                          <p className="text-[14px] leading-[18px] mb-2">{reply.content}</p>
                          <div className="flex items-center gap-8">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-auto p-0 gap-2 transition-colors ${
                                reply.isLiked 
                                  ? 'text-pink-600 hover:text-pink-700' 
                                  : 'text-muted-foreground hover:text-pink-600'
                              }`}
                              onClick={async () => {
                                if (!isSignedIn) {
                                  toast({
                                    title: "Sign in required",
                                    description: "Please sign in to like comments",
                                    variant: "destructive",
                                  });
                                  router.push("/auth");
                                  return;
                                }
                                
                                if (likingComments.has(reply.id)) return;
                                
                                setLikingComments(prev => new Set(prev).add(reply.id));
                                try {
                                  const result = reply.isLiked 
                                    ? await unlikeComment(reply.id)
                                    : await likeComment(reply.id);
                                  
                                  if (result.error) {
                                    toast({
                                      title: "Error",
                                      description: result.error,
                                      variant: "destructive",
                                    });
                                  } else if (result.data) {
                                    // Update the reply's like status within its parent comment
                                    const resultData = result.data;
                                    setComments(prevComments => 
                                      prevComments.map(c => 
                                        c.id === comment.id
                                          ? {
                                              ...c,
                                              replies: (c.replies || []).map(r =>
                                                r.id === reply.id
                                                  ? { ...r, likes: resultData.likes_count, isLiked: resultData.user_liked }
                                                  : r
                                              )
                                            }
                                          : c
                                      )
                                    );
                                  }
                                } catch (error: any) {
                                  toast({
                                    title: "Error",
                                    description: error.message || "Failed to update like",
                                    variant: "destructive",
                                  });
                                } finally {
                                  setLikingComments(prev => {
                                    const next = new Set(prev);
                                    next.delete(reply.id);
                                    return next;
                                  });
                                }
                              }}
                              disabled={likingComments.has(reply.id)}
                            >
                              <Heart className={`w-[16px] h-[16px] ${reply.isLiked ? 'fill-current' : ''}`} />
                              <span className="text-[12px]">{reply.likes}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

