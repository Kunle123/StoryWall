/**
 * TypeScript types and interfaces for timeline components
 */

/**
 * Represents a single event in a timeline
 */
export interface TimelineEvent {
  id: string;             // Unique identifier
  title: string;          // Event title
  description: string;    // Event description
  date: Date | string;    // Event date (can be Date object or ISO string)
  importance: number;     // Event importance (1-5)
  imageUrl?: string;      // Optional image URL
  videoUrl?: string;      // Optional video URL
  category?: string;      // Optional category for filtering
  location?: string;      // Optional location information
  media?: {
    type: string;
    url: string;
    caption: string;
  }[];
  sources?: {
    title: string;
    url: string;
  }[];
}

/**
 * Represents the zoomed range of dates in the horizontal timeline
 */
export interface ZoomedRange {
  start: Date;
  end: Date;
}

/**
 * Data structure for the timeline
 */
export interface TimelineData {
  events: TimelineEvent[];
  title?: string;        // Optional timeline title
  description?: string;  // Optional timeline description
}

/**
 * Props for the Circular Dial Timeline
 * Using Zustand store, so we only need dimensions
 */
export interface CircularDialTimelineProps {
  width?: number;
  height?: number;
}

/**
 * Props for the Horizontal Timeline
 * Using Zustand store, so we only need dimensions
 */
export interface HorizontalTimelineProps {
  width?: number;
  height?: number;
}

/**
 * Props for the Event Detail component
 * Using Zustand store, so we don't need props
 */
export interface EventDetailProps {
  // No props needed, component gets data from store
}

/**
 * Props for the main Timeline Container
 */
export interface TimelineContainerProps {
  timelineData: TimelineData;
  width?: number;
  height?: number;
  initialEventId?: string;
} 