import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { MessageCircle, Send, Heart } from "lucide-react";

interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timestamp: string;
  likes: number;
}

interface CommentsSectionProps {
  comments?: Comment[];
  onAddComment?: (content: string) => void;
}

export const CommentsSection = ({ 
  comments = [],
  onAddComment 
}: CommentsSectionProps) => {
  const [newComment, setNewComment] = useState("");

  const handleSubmit = () => {
    if (newComment.trim() && onAddComment) {
      onAddComment(newComment);
      setNewComment("");
    }
  };

  return (
    <div className="space-y-0">
      {/* Comment input */}
      <div className="flex gap-3 py-4">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src="" />
          <AvatarFallback className="text-sm">U</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder="Post your reply"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] resize-none border-0 p-0 text-[15px] placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <div className="flex justify-end mt-3">
            <Button 
              size="sm" 
              onClick={handleSubmit}
              disabled={!newComment.trim()}
              className="rounded-full h-9 px-4 text-[15px] font-bold"
            >
              Reply
            </Button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div>
        {comments.length === 0 ? (
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
                    className="h-auto p-0 gap-2 text-muted-foreground hover:text-pink-600 transition-colors"
                  >
                    <Heart className="w-[18px] h-[18px]" />
                    <span className="text-[13px]">{comment.likes}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-[13px] text-muted-foreground hover:text-primary transition-colors"
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
