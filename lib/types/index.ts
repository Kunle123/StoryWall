export interface User {
  id: string;
  clerk_id: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export type VisualizationType = 'horizontal' | 'vertical' | 'grid';

export interface Event {
  id: string;
  timeline_id: string;
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
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  timeline_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Timeline {
  id: string;
  title: string;
  description?: string;
  slug: string;
  creator_id: string;
  creator?: User;
  visualization_type: VisualizationType;
  is_public: boolean;
  is_collaborative: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  events?: Event[];
  categories?: Category[];
}

export interface Collaborator {
  id: string;
  timeline_id: string;
  user_id: string;
  user?: User;
  role: 'editor' | 'viewer';
  added_at: string;
}

export interface CreateTimelineInput {
  title: string;
  description?: string;
  visualization_type?: VisualizationType;
  is_public?: boolean;
  is_collaborative?: boolean;
}

export interface CreateEventInput {
  timeline_id: string;
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
}


