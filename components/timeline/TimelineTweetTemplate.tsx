"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Share2, Loader2, Twitter, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

interface TimelineTweetTemplateProps {
  title: string;
  description: string;
  imageUrl: string;
  timelineUrl: string;
}

export const TimelineTweetTemplate = ({
  title,
  description,
  imageUrl,
  timelineUrl,
}: TimelineTweetTemplateProps) => {
  const { toast } = useToast();
  const { isSignedIn } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [hasOAuth1, setHasOAuth1] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Calculate tweet length with URL counting as 23 characters (Twitter's shortened URL length)
  // Twitter automatically shortens URLs to ~23 characters, but we must include the full URL
  const URL_LENGTH = 23; // Twitter counts URLs as 23 characters when shortened
  const NEWLINE_LENGTH = 2; // \n\n counts as 2 characters
  
  // Build tweet text, ensuring it fits within 280 characters
  // The URL will be included in full - Twitter will shorten it automatically
  const buildTweetText = (title: string, description: string, url: string): { text: string; effectiveLength: number; wasTruncated: boolean } => {
    // Calculate available space: 280 total - title - newlines - URL (counted as 23)
    // Format: title + \n\n + description + \n\n + url
    const titleLength = title.length;
    const urlLength = URL_LENGTH; // Twitter counts URLs as 23 chars
    const newlinesLength = NEWLINE_LENGTH * 2; // Two \n\n separators
    
    // Calculate max description length
    const maxDescriptionLength = Math.max(0, 280 - titleLength - newlinesLength - urlLength);
    
    let finalDescription = description;
    let wasTruncated = false;
    if (description.length > maxDescriptionLength) {
      // Truncate description and add ellipsis if needed
      const truncateLength = Math.max(0, maxDescriptionLength - 3);
      if (truncateLength > 0) {
        finalDescription = description.substring(0, truncateLength) + '...';
        wasTruncated = true;
      } else {
        // If there's no room for description, just use title and URL
        finalDescription = '';
        wasTruncated = true;
      }
    }
    
    // Always include the full URL - Twitter will shorten it automatically
    // NEVER truncate the URL - it's essential for linking back
    let tweetText: string;
    if (finalDescription) {
      tweetText = `${title}\n\n${finalDescription}\n\n${url}`;
    } else {
      // If description was too long and had to be removed, just use title and URL
      tweetText = `${title}\n\n${url}`;
    }
    
    // Verify the tweet text length
    // The actual text will be longer than 280 because the URL is full length
    // But Twitter counts URLs as 23, so the effective length should be <= 280
    const actualTextLength = tweetText.length;
    const effectiveLength = titleLength + (finalDescription ? finalDescription.length : 0) + newlinesLength + urlLength;
    
    // CRITICAL FIX: If effective length exceeds 280, we MUST truncate more aggressively
    // Twitter will truncate the actual text, which could cut off the URL
    if (effectiveLength > 280) {
      console.warn(`[TimelineTweetTemplate] Effective tweet length (${effectiveLength}) exceeds 280. Truncating description more aggressively.`);
      // Recalculate with even less room for description
      const newMaxDescLength = Math.max(0, 280 - titleLength - newlinesLength - urlLength - 10); // Extra buffer
      if (newMaxDescLength > 0 && finalDescription.length > newMaxDescLength) {
        finalDescription = finalDescription.substring(0, Math.max(0, newMaxDescLength - 3)) + '...';
        wasTruncated = true;
        // Rebuild tweet text
        if (finalDescription) {
          tweetText = `${title}\n\n${finalDescription}\n\n${url}`;
        } else {
          tweetText = `${title}\n\n${url}`;
        }
      }
    }
    
    return { text: tweetText, effectiveLength, wasTruncated };
  };
  
  const { text: tweetText, effectiveLength, wasTruncated } = buildTweetText(title, description, timelineUrl);

  // Ensure image URL is absolute for Twitter API
  const getAbsoluteImageUrl = (url: string): string => {
    if (!url) {
      console.log('[TimelineTweetTemplate] No image URL provided');
      return '';
    }
    // If already absolute (starts with http:// or https://), return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.log('[TimelineTweetTemplate] Image URL is already absolute:', url);
      return url;
    }
    // If relative, convert to absolute using current origin
    if (typeof window !== 'undefined') {
      // If starts with /, it's a root-relative URL
      if (url.startsWith('/')) {
        const absoluteUrl = `${window.location.origin}${url}`;
        console.log('[TimelineTweetTemplate] Converted root-relative URL to absolute:', absoluteUrl);
        return absoluteUrl;
      }
      // Otherwise, it's a relative URL - prepend origin
      const absoluteUrl = `${window.location.origin}/${url}`;
      console.log('[TimelineTweetTemplate] Converted relative URL to absolute:', absoluteUrl);
      return absoluteUrl;
    }
    // Fallback for server-side (shouldn't happen in this component)
    console.warn('[TimelineTweetTemplate] Window not available, returning original URL:', url);
    return url;
  };

  const absoluteImageUrl = imageUrl ? getAbsoluteImageUrl(imageUrl) : '';
  
  // Debug log
  useEffect(() => {
    if (imageUrl) {
      console.log('[TimelineTweetTemplate] Image URL received:', imageUrl);
      console.log('[TimelineTweetTemplate] Absolute image URL:', absoluteImageUrl);
    } else {
      console.warn('[TimelineTweetTemplate] No image URL provided to component');
    }
  }, [imageUrl, absoluteImageUrl]);

  // Check Twitter connection status
  useEffect(() => {
    if (isSignedIn && absoluteImageUrl) {
      setIsChecking(true);
      fetch('/api/twitter/status')
        .then(res => res.json())
        .then(data => {
          setIsConnected(data.connected || false);
          setHasOAuth1(data.hasOAuth1 || false);
        })
        .catch(() => {
          setIsConnected(false);
          setHasOAuth1(false);
        })
        .finally(() => setIsChecking(false));
    }
  }, [isSignedIn, absoluteImageUrl]);

  const handleCopyTweet = () => {
    navigator.clipboard.writeText(tweetText);
    toast({
      title: "Tweet copied!",
      description: "Tweet text has been copied to clipboard",
    });
  };

  const handleConnectTwitter = async () => {
    try {
      console.log('[TimelineTweetTemplate] Initiating Twitter connection...');
      
      // Store the current page path (not full URL) to redirect back after OAuth
      // Use pathname + search to preserve any query params, but not the origin
      const returnPath = typeof window !== 'undefined' 
        ? `${window.location.pathname}${window.location.search}`
        : '/';
      
      console.log('[TimelineTweetTemplate] Return path:', returnPath);
      
      const oauthUrl = `/api/twitter/oauth?returnUrl=${encodeURIComponent(returnPath)}`;
      const response = await fetch(oauthUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[TimelineTweetTemplate] OAuth initiation failed:', errorData);
        throw new Error(errorData.error || 'Failed to initiate Twitter connection');
      }
      
      const data = await response.json();
      console.log('[TimelineTweetTemplate] Got auth URL, redirecting...', data);
      
      if (!data.authUrl) {
        throw new Error('No auth URL received from server');
      }
      
      // Redirect to Twitter OAuth
      window.location.href = data.authUrl;
    } catch (error: any) {
      console.error('[TimelineTweetTemplate] Error connecting Twitter:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to connect Twitter. Please try again.",
        variant: "destructive",
      });
    }
  };



  const handleShareOnTwitter = async () => {
    // If image is present and user is connected, use API to post with image
    if (absoluteImageUrl && isSignedIn && isConnected) {
      setIsPosting(true);
      try {
        console.log('[TimelineTweetTemplate] Posting tweet with image:', absoluteImageUrl);
        const response = await fetch('/api/twitter/post-tweet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: tweetText,
            imageUrl: absoluteImageUrl,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('[TimelineTweetTemplate] Tweet post failed:', error);
          if (error.error?.includes('not connected')) {
            setIsConnected(false);
            toast({
              title: "Twitter not connected",
              description: "Please connect your Twitter account to post with image",
              variant: "destructive",
            });
            return;
          }
          
          // Handle 403 Forbidden specifically
          if (response.status === 403 || error.code === 'TWITTER_MEDIA_UPLOAD_FORBIDDEN') {
            toast({
              title: "Twitter Permission Error",
              description: error.details || "Your Twitter account needs media upload permissions. Please disconnect and reconnect your Twitter account to grant the 'media.write' scope.",
              variant: "destructive",
            });
            setIsConnected(false); // Mark as disconnected so user can reconnect
            return;
          }
          
          // Show detailed error message if available
          const errorMessage = error.details 
            ? `${error.error}: ${error.details}`
            : error.error || 'Failed to post tweet';
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('[TimelineTweetTemplate] Tweet posted successfully:', result);
        
        if (result.warning) {
          toast({
            title: "Tweet posted (without image)",
            description: result.warning,
            variant: "default",
          });
        } else {
          toast({
            title: "Success!",
            description: result.imageAttached 
              ? "Tweet posted with image attached" 
              : "Tweet posted successfully",
          });
        }

        if (result.tweetUrl) {
          window.open(result.tweetUrl, '_blank');
        }
      } catch (error: any) {
        console.error('[TimelineTweetTemplate] Error posting tweet:', error);
        
        // Check if it's an OAuth 1.0a token mismatch error
        const errorMessage = error.message || '';
        if (errorMessage.includes('Bad Authentication') || errorMessage.includes('OAuth 1.0a authentication failed')) {
          toast({
            title: "Authentication Required",
            description: "Your Twitter connection needs to be refreshed. Redirecting to reconnect...",
            variant: "default",
          });
          
          // Automatically trigger full re-authentication (both OAuth 2.0 and 1.0a)
          setTimeout(() => {
            handleConnectTwitter();
          }, 1500);
          return;
        }
        
        toast({
          title: "Error",
          description: error.message || "Failed to post tweet",
          variant: "destructive",
        });
      } finally {
        setIsPosting(false);
      }
    } else {
      // Fallback to intent URL (no image support)
      console.log('[TimelineTweetTemplate] Using fallback (no image or not connected):', {
        hasImage: !!absoluteImageUrl,
        isSignedIn,
        isConnected
      });
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
      window.open(twitterUrl, "_blank");
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Tweet Preview</h3>
        <p className="text-sm text-muted-foreground">
          Ready to share on Twitter/X
        </p>
      </div>

      {/* Image with StoryWall branding */}
      {absoluteImageUrl && (
        <div className="relative aspect-square w-full max-w-md mx-auto overflow-hidden rounded-lg border border-border">
        <img
          src={absoluteImageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        {/* StoryWall branding overlay */}
        <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">SW</span>
          </div>
        </div>
      </div>
      )}

      {/* Tweet text */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Tweet text:</p>
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <p className="text-sm font-bold">{title}</p>
          <p className="text-sm whitespace-pre-wrap pt-2">{description}</p>
          <div className="pt-2">
            <a
              href={timelineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline block"
            >
              {timelineUrl}
            </a>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        {/* Show connect button prominently if not connected */}
        {isSignedIn && !isConnected && !isChecking && (
          <Button
            onClick={handleConnectTwitter}
            className="w-full gap-2"
            variant="default"
          >
            <Twitter className="h-4 w-4" />
            Connect Twitter Account
          </Button>
        )}
        
        <div className="flex gap-2">
          <Button
            onClick={handleCopyTweet}
            variant="outline"
            className="flex-1 gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Tweet
          </Button>
          <Button
            onClick={handleShareOnTwitter}
            disabled={isPosting || isChecking}
            className="flex-1 gap-2"
          >
            {isPosting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                {absoluteImageUrl && isSignedIn && isConnected ? "Post on X" : "Share on X"}
              </>
            )}
          </Button>
        </div>
        
        {/* Twitter connection status */}
        {isSignedIn && (
          <div className="text-xs text-muted-foreground space-y-2">
            {isChecking ? (
              "Checking Twitter connection..."
            ) : isConnected ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>✓ Connected (OAuth 2.0)</span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleConnectTwitter}
                    className="h-auto p-0 text-xs"
                  >
                    Reconnect
                  </Button>
                </div>
                {absoluteImageUrl && (
                  <div className="flex items-center gap-2">
                    {hasOAuth1 ? (
                      <span className="text-green-600 dark:text-green-400">✓ Image upload enabled</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">⚠️ Image upload not configured - reconnect to enable</span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span>⚠️ Not connected</span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleConnectTwitter}
                  className="h-auto p-0 text-xs font-semibold"
                >
                  Connect Twitter
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Character count */}
      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>
          Effective length: ~{effectiveLength}/280 
          <span className="text-muted-foreground ml-1">
            (URL counts as {URL_LENGTH} chars when shortened by Twitter)
          </span>
          {effectiveLength > 280 && (
            <span className="text-destructive ml-2">⚠️ Too long! Description will be truncated.</span>
          )}
        </p>
        {wasTruncated && (
          <p className="text-amber-600 dark:text-amber-400">
            ℹ️ Description was truncated to ensure the complete URL is included
          </p>
        )}
        <p className="text-xs text-green-600 dark:text-green-400 font-medium">
          ✓ Full URL will always be included - Twitter automatically shortens it to ~23 characters
        </p>
        <p className="text-xs text-muted-foreground">
          Users can click the shortened URL to link back to the timeline on storywall.com
        </p>
      </div>
    </Card>
  );
};

