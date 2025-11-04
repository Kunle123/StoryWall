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
  const date = new Date(apiEvent.date);
  return {
    id: apiEvent.id,
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
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

export async function createComment(timelineId: string, content: string): Promise<ApiResponse<Comment>> {
  try {
    const response = await fetch(`/api/timelines/${timelineId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
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

