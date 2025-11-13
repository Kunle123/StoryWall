// API client functions for frontend

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || '';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Timeline API calls
export async function fetchTimelines(options?: {
  limit?: number;
  offset?: number;
  is_public?: boolean;
  creator_id?: string;
  mine?: boolean; // Fetch current user's timelines
}): Promise<ApiResponse<any[]>> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.is_public !== undefined) params.append('is_public', options.is_public.toString());
    if (options?.creator_id) params.append('creator_id', options.creator_id);
    if (options?.mine) params.append('mine', 'true');

    const url = `/api/timelines${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to fetch timelines' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch timelines' };
  }
}

export async function fetchTimelineById(id: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`/api/timelines/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        return { error: 'Timeline not found' };
      }
      const error = await response.json();
      return { error: error.error || 'Failed to fetch timeline' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch timeline' };
  }
}

export async function updateTimeline(id: string, updates: {
  title?: string;
  description?: string;
  visualization_type?: 'horizontal' | 'vertical' | 'grid';
  is_public?: boolean;
  is_collaborative?: boolean;
}): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`/api/timelines/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to update timeline' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to update timeline' };
  }
}

export async function deleteTimeline(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`/api/timelines/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to delete timeline' };
    }

    return { data: undefined };
  } catch (error: any) {
    return { error: error.message || 'Failed to delete timeline' };
  }
}

export async function createTimeline(timelineData: {
  title: string;
  description?: string;
  visualization_type?: 'horizontal' | 'vertical' | 'grid';
  is_public?: boolean;
  is_collaborative?: boolean;
  is_numbered?: boolean;
  hashtags?: string[];
  number_label?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}): Promise<ApiResponse<any>> {
  try {
    console.log('[API] Creating timeline:', timelineData);
    
    const response = await fetch('/api/timelines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(timelineData),
    });

    console.log('[API] Timeline creation response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText || `HTTP ${response.status}: ${response.statusText}` };
      }
      
      console.error('[API] Timeline creation failed:', error);
      return { error: error.error || 'Failed to create timeline' };
    }

    const data = await response.json();
    console.log('[API] Timeline created successfully:', data);
    return { data };
  } catch (error: any) {
    console.error('[API] Timeline creation exception:', error);
    return { error: error.message || 'Failed to create timeline' };
  }
}

// Event API calls
export async function fetchEventsByTimelineId(timelineId: string): Promise<ApiResponse<any[]>> {
  try {
    const response = await fetch(`/api/timelines/${timelineId}/events`);

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to fetch events' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch events' };
  }
}

export async function fetchEventById(id: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`/api/events/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        return { error: 'Event not found' };
      }
      const error = await response.json();
      return { error: error.error || 'Failed to fetch event' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch event' };
  }
}

export async function createEvent(timelineId: string, eventData: {
  title: string;
  description?: string;
  date: string;
  end_date?: string;
  number?: number;
  number_label?: string;
  image_url?: string;
  location_lat?: number;
  location_lng?: number;
  location_name?: string;
  category?: string;
  links?: string[];
}): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`/api/timelines/${timelineId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to create event' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to create event' };
  }
}

export async function updateEvent(id: string, eventData: Partial<{
  title: string;
  description?: string;
  date: string;
  end_date?: string;
  image_url?: string;
  location_lat?: number;
  location_lng?: number;
  location_name?: string;
  category?: string;
  links?: string[];
}>): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to update event' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to update event' };
  }
}

export async function deleteEventById(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to delete event' };
    }

    return { data: undefined };
  } catch (error: any) {
    return { error: error.message || 'Failed to delete event' };
  }
}

// Helper function to get or create user's portfolio timeline
export async function getOrCreatePortfolioTimeline(): Promise<ApiResponse<any>> {
  try {
    // Fetch all timelines (server will filter by test user ID if needed)
    // Since auth is disabled, server uses test user ID automatically
    const timelinesResult = await fetchTimelines({ limit: 100 });
    
    if (timelinesResult.data) {
      // Find portfolio timeline by title or slug
      const portfolioTimeline = timelinesResult.data.find(
        (t: any) => t.title === 'My Portfolio' || t.slug === 'my-portfolio'
      );
      
      if (portfolioTimeline) {
        return { data: portfolioTimeline };
      }
    }
    
    // Create portfolio timeline if it doesn't exist
    // Server will automatically assign it to the test user
    const createResult = await createTimeline({
      title: 'My Portfolio',
      description: 'My personal collection of timeline events',
      is_public: false,
      is_collaborative: false,
    });
    
    return createResult;
  } catch (error: any) {
    return { error: error.message || 'Failed to get or create portfolio timeline' };
  }
}

// Helper function to transform API event to TimelineEvent format
export function transformApiEventToTimelineEvent(apiEvent: any) {
  // Check if this is a numbered event (has number field)
  if (apiEvent.number !== undefined && apiEvent.number !== null) {
    return {
      id: apiEvent.id,
      number: apiEvent.number,
      numberLabel: apiEvent.number_label || "Day",
      title: apiEvent.title,
      description: apiEvent.description,
      category: apiEvent.category,
      image: apiEvent.image_url,
      video: undefined,
    };
  }
  
  // For dated events, parse the date
  // Handle BC dates correctly - JavaScript Date doesn't handle negative years
  const dateStr = typeof apiEvent.date === 'string' ? apiEvent.date : apiEvent.date.toISOString().split('T')[0];
  
  // Check if this is a BC date (starts with negative sign in ISO format)
  // BC dates are stored as negative years in ISO format: "-9500-01-01"
  let year: number;
  let month: number | undefined;
  let day: number | undefined;
  
  if (dateStr.startsWith('-')) {
    // BC date: parse from string directly
    const match = dateStr.match(/^-(\d+)-(\d+)-(\d+)$/);
    if (match) {
      year = -parseInt(match[1], 10); // Negative year for BC
      const monthNum = parseInt(match[2], 10);
      const dayNum = parseInt(match[3], 10);
      // Only include month/day if not Jan 1 (year-only placeholder)
      if (monthNum !== 1 || dayNum !== 1) {
        month = monthNum;
        day = dayNum;
      }
    } else {
      // Fallback: try to parse as number
      year = parseInt(dateStr.split('-')[0], 10);
    }
  } else {
    // AD date: use Date object
    const date = new Date(apiEvent.date);
    year = date.getFullYear();
    const monthNum = date.getMonth() + 1;
    const dayNum = date.getDate();
    // Only include month/day if not Jan 1 (year-only placeholder)
    if (monthNum !== 1 || dayNum !== 1 || year === 1) {
      month = monthNum;
      day = dayNum;
    }
  }
  
  return {
    id: apiEvent.id,
    year: year,
    month: month,
    day: day,
    title: apiEvent.title,
    description: apiEvent.description,
    category: apiEvent.category,
    image: apiEvent.image_url,
    video: undefined, // Not in API yet
  };
}

// Comment API calls
export interface Comment {
  id: string;
  timeline_id: string;
  event_id?: string;
  parent_id?: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  likes_count?: number;
  replies?: Comment[];
}

export async function fetchCommentsByTimelineId(timelineId: string): Promise<ApiResponse<Comment[]>> {
  try {
    const response = await fetch(`/api/timelines/${timelineId}/comments`);

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to fetch comments' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch comments' };
  }
}

export async function createComment(timelineId: string, content: string, parentId?: string): Promise<ApiResponse<Comment>> {
  try {
    const body: { content: string; parent_id?: string } = { content };
    if (parentId) {
      body.parent_id = parentId;
    }
    
    const response = await fetch(`/api/timelines/${timelineId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create comment';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If response is not JSON, use status text
        if (response.status === 401) {
          errorMessage = 'Unauthorized';
        } else if (response.status === 404) {
          errorMessage = 'Timeline not found';
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      }
      
      return { error: errorMessage };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    console.error('[API] Exception creating comment:', error);
    return { error: error.message || 'Failed to create comment' };
  }
}

export async function updateComment(timelineId: string, commentId: string, content: string): Promise<ApiResponse<Comment>> {
  try {
    const response = await fetch(`/api/timelines/${timelineId}/comments`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_id: commentId, content }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to update comment' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to update comment' };
  }
}

export async function deleteComment(timelineId: string, commentId: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`/api/timelines/${timelineId}/comments?comment_id=${commentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to delete comment' };
    }

    return { data: undefined };
  } catch (error: any) {
    return { error: error.message || 'Failed to delete comment' };
  }
}

// Event comment API calls
export async function fetchCommentsByEventId(eventId: string): Promise<ApiResponse<Comment[]>> {
  try {
    const response = await fetch(`/api/events/${eventId}/comments`);

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to fetch comments' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch comments' };
  }
}

export async function createEventComment(eventId: string, content: string, parentId?: string): Promise<ApiResponse<Comment>> {
  try {
    const body: { content: string; parent_id?: string } = { content };
    if (parentId) {
      body.parent_id = parentId;
    }
    
    const response = await fetch(`/api/events/${eventId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create comment';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        if (response.status === 401) {
          errorMessage = 'Unauthorized';
        } else if (response.status === 404) {
          errorMessage = 'Event not found';
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      }
      
      return { error: errorMessage };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    console.error('[API] Exception creating event comment:', error);
    return { error: error.message || 'Failed to create comment' };
  }
}

// Like API calls
export interface LikeStatus {
  timeline_id: string;
  likes_count: number;
  user_liked: boolean;
}

export async function fetchLikeStatus(timelineId: string): Promise<ApiResponse<LikeStatus>> {
  try {
    const response = await fetch(`/api/timelines/${timelineId}/likes`);

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to fetch like status' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch like status' };
  }
}

export async function likeTimeline(timelineId: string): Promise<ApiResponse<{ message: string; liked: boolean; likes_count: number }>> {
  try {
    const response = await fetch(`/api/timelines/${timelineId}/likes`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to like timeline' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to like timeline' };
  }
}

export async function unlikeTimeline(timelineId: string): Promise<ApiResponse<{ message: string; liked: boolean; likes_count: number }>> {
  try {
    const response = await fetch(`/api/timelines/${timelineId}/likes`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to unlike timeline' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to unlike timeline' };
  }
}

// Event like API calls
export interface EventLikeStatus {
  event_id: string;
  likes_count: number;
  user_liked: boolean;
}

export async function fetchEventLikeStatus(eventId: string): Promise<ApiResponse<EventLikeStatus>> {
  try {
    const response = await fetch(`/api/events/${eventId}/likes`);

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to fetch like status' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch like status' };
  }
}

export async function likeEvent(eventId: string): Promise<ApiResponse<{ message: string; liked: boolean; likes_count: number }>> {
  try {
    const response = await fetch(`/api/events/${eventId}/likes`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to like event' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to like event' };
  }
}

export async function unlikeEvent(eventId: string): Promise<ApiResponse<{ message: string; liked: boolean; likes_count: number }>> {
  try {
    const response = await fetch(`/api/events/${eventId}/likes`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to unlike event' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to unlike event' };
  }
}

// Comment likes
export interface CommentLikeStatus {
  comment_id: string;
  likes_count: number;
  user_liked: boolean;
}

export async function fetchCommentLikeStatus(commentId: string): Promise<ApiResponse<CommentLikeStatus>> {
  try {
    const response = await fetch(`/api/comments/${commentId}/likes`);

    if (!response.ok) {
      let errorMessage = 'Failed to fetch like status';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        if (response.status === 404) {
          errorMessage = 'Comment not found';
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      }
      
      return { error: errorMessage };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch like status' };
  }
}

export async function likeComment(commentId: string): Promise<ApiResponse<CommentLikeStatus>> {
  try {
    const response = await fetch(`/api/comments/${commentId}/likes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to like comment';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        if (response.status === 401) {
          errorMessage = 'Unauthorized';
        } else if (response.status === 404) {
          errorMessage = 'Comment not found';
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      }
      
      return { error: errorMessage };
    }

    const data = await response.json();
    return { 
      data: {
        comment_id: commentId,
        likes_count: data.likes_count,
        user_liked: data.liked,
      }
    };
  } catch (error: any) {
    return { error: error.message || 'Failed to like comment' };
  }
}

export async function unlikeComment(commentId: string): Promise<ApiResponse<CommentLikeStatus>> {
  try {
    const response = await fetch(`/api/comments/${commentId}/likes`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to unlike comment';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        if (response.status === 401) {
          errorMessage = 'Unauthorized';
        } else if (response.status === 404) {
          errorMessage = 'Comment not found';
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      }
      
      return { error: errorMessage };
    }

    const data = await response.json();
    return { 
      data: {
        comment_id: commentId,
        likes_count: data.likes_count,
        user_liked: data.liked,
      }
    };
  } catch (error: any) {
    return { error: error.message || 'Failed to unlike comment' };
  }
}

// User Profile API calls
export interface UserProfile {
  id: string;
  clerk_id: string;
  username: string;
  email: string;
  avatar_url?: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

export async function fetchUserProfile(): Promise<ApiResponse<UserProfile>> {
  try {
    const response = await fetch('/api/user/profile');

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to fetch profile' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch profile' };
  }
}

export async function updateUserProfile(updates: {
  username?: string;
  avatar_url?: string;
}): Promise<ApiResponse<UserProfile>> {
  try {
    const response = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to update profile' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to update profile' };
  }
}

// Follow API calls
export interface FollowStatus {
  following: boolean;
  follower_count: number;
  following_count: number;
}

export async function fetchFollowStatus(userId: string): Promise<ApiResponse<FollowStatus>> {
  try {
    const response = await fetch(`/api/users/${userId}/follow`);

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to fetch follow status' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch follow status' };
  }
}

export async function followUser(userId: string): Promise<ApiResponse<FollowStatus>> {
  try {
    const response = await fetch(`/api/users/${userId}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to follow user' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to follow user' };
  }
}

export async function unfollowUser(userId: string): Promise<ApiResponse<FollowStatus>> {
  try {
    const response = await fetch(`/api/users/${userId}/follow`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to unfollow user' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to unfollow user' };
  }
}

