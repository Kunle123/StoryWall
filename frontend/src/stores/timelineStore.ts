import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { axiosInstance } from '../api/axios';

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  importance: number;
  location?: string;
  category?: string;
  imageUrl?: string;
  videoUrl?: string;
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

export interface Timeline {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  author: {
    id: string;
    name: string;
    avatar_url: string;
  };
  social_metrics: {
    likes: number;
    shares: number;
    comments: number;
  };
  events: TimelineEvent[];
}

export interface ZoomedTimespan {
  start: Date;
  end: Date;
}

export interface TimelineState {
  // Core data
  timelines: Timeline[];
  currentTimeline: Timeline | null;
  events: TimelineEvent[];
  
  // UI state
  selectedEventId: string | null;
  loading: boolean;
  error: string | null;
  zoomedTimespan: ZoomedTimespan | null;
  horizontalOffset: number;
  
  // Actions
  fetchTimeline: (id: string) => Promise<void>;
  selectEvent: (id: string) => void;
  selectNextEvent: () => void;
  selectPreviousEvent: () => void;
  calculateZoomedTimespan: () => void;
  recalculateOffset: (offset: number) => void;
  incrementShareCount: (timelineId: string) => Promise<void>;
  clearError: () => void;
  
  // Utilities
  getSelectedEvent: () => TimelineEvent | null;
  getFilteredEvents: () => TimelineEvent[];
}

type TimelineStatePersist = {
  currentTimeline: Timeline | null;
  selectedEventId: string | null;
  zoomedTimespan: ZoomedTimespan | null;
};

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set, get) => ({
      // Core data
      timelines: [],
      currentTimeline: null,
      events: [],
      
      // UI state
      selectedEventId: null,
      loading: false,
      error: null,
      zoomedTimespan: null,
      horizontalOffset: 0,
      
      // Actions
      fetchTimeline: async (id: string) => {
        try {
          set({ loading: true, error: null });
          
          let response;
          try {
            response = await axiosInstance.get(`/api/timelines/${id}`);
            const timeline = response.data;
            
            set({
              currentTimeline: timeline,
              events: timeline.events,
              loading: false
            });
            
            // Select first event by default if there are events
            if (timeline.events && timeline.events.length > 0 && !get().selectedEventId) {
              get().selectEvent(timeline.events[0].id);
            }
          } catch (error) {
            console.log('API not available, using mock data');
            
            // Mock timeline data for development
            const mockTimeline = {
              id: "timeline-001",
              title: "Israeli-Palestinian Conflict",
              description: "A timeline of key events in the Israeli-Palestinian conflict from 1948 to present day.",
              start_date: "1948",
              end_date: "2023",
              author: {
                id: "user-001",
                name: "Historical Archives",
                avatar_url: "https://via.placeholder.com/50"
              },
              social_metrics: {
                likes: 245,
                shares: 128,
                comments: 37
              },
              events: [
                {
                  id: "event-001",
                  title: "Israel Independence",
                  date: "1948-05-14",
                  description: "State of Israel is established following the end of the British Mandate for Palestine.",
                  importance: 5,
                  media: [
                    {
                      type: "image",
                      url: "https://via.placeholder.com/600x400",
                      caption: "Declaration of Independence ceremony"
                    }
                  ]
                },
                {
                  id: "event-002",
                  title: "Six-Day War",
                  date: "1967-06-05",
                  description: "War between Israel and neighboring states that resulted in Israeli occupation of the West Bank, Gaza Strip, Sinai Peninsula, and Golan Heights.",
                  importance: 5,
                  media: [
                    {
                      type: "image",
                      url: "https://via.placeholder.com/600x400",
                      caption: "Israeli forces during the Six-Day War"
                    }
                  ]
                },
                {
                  id: "event-003",
                  title: "First Intifada",
                  date: "1987-12-08",
                  description: "Palestinian uprising against Israeli occupation in the Gaza Strip and West Bank.",
                  importance: 3,
                  media: [
                    {
                      type: "image",
                      url: "https://via.placeholder.com/600x400",
                      caption: "Protests in Gaza"
                    }
                  ]
                }
              ]
            };
            
            set({
              currentTimeline: mockTimeline,
              events: mockTimeline.events,
              loading: false
            });
            
            // Select first event by default if there are events
            if (mockTimeline.events && mockTimeline.events.length > 0 && !get().selectedEventId) {
              get().selectEvent(mockTimeline.events[0].id);
            }
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.message || error.message || 'Failed to load timeline'
          });
        }
      },
      
      selectEvent: (id: string) => {
        console.log('Store: Selecting event', id);
        set({ selectedEventId: id });
        get().calculateZoomedTimespan();
      },
      
      selectNextEvent: () => {
        const { events, selectedEventId } = get();
        if (!events.length || !selectedEventId) return;
        
        // Sort events by date
        const sortedEvents = [...events].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        const currentIndex = sortedEvents.findIndex(e => e.id === selectedEventId);
        if (currentIndex !== -1 && currentIndex < sortedEvents.length - 1) {
          const nextEvent = sortedEvents[currentIndex + 1];
          get().selectEvent(nextEvent.id);
        }
      },
      
      selectPreviousEvent: () => {
        const { events, selectedEventId } = get();
        if (!events.length || !selectedEventId) return;
        
        // Sort events by date
        const sortedEvents = [...events].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        const currentIndex = sortedEvents.findIndex(e => e.id === selectedEventId);
        if (currentIndex > 0) {
          const prevEvent = sortedEvents[currentIndex - 1];
          get().selectEvent(prevEvent.id);
        }
      },
      
      calculateZoomedTimespan: () => {
        const { events, selectedEventId } = get();
        if (!events.length || !selectedEventId) return;
        
        // Sort events by date
        const sortedEvents = [...events].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        const timespan = {
          start: new Date(sortedEvents[0].date),
          end: new Date(sortedEvents[sortedEvents.length - 1].date)
        };
        
        const totalTimeMs = timespan.end.getTime() - timespan.start.getTime();
        const zoomTimeMs = totalTimeMs * 0.1; // 10% of total timespan
        
        const selectedEvent = events.find(e => e.id === selectedEventId);
        if (!selectedEvent) return;
        
        const selectedDate = new Date(selectedEvent.date);
        const halfZoomMs = zoomTimeMs / 2;
        
        // Calculate optimal timespan
        let start = new Date(selectedDate.getTime() - halfZoomMs);
        let end = new Date(selectedDate.getTime() + halfZoomMs);
        
        // Handle edge cases
        if (start < timespan.start) {
          start = timespan.start;
          end = new Date(start.getTime() + zoomTimeMs);
        } else if (end > timespan.end) {
          end = timespan.end;
          start = new Date(end.getTime() - zoomTimeMs);
        }
        
        set({ zoomedTimespan: { start, end } });
        console.log('Zoomed timespan updated:', { start, end });
      },
      
      recalculateOffset: (offset: number) => {
        set({ horizontalOffset: offset });
      },
      
      incrementShareCount: async (timelineId: string) => {
        const { currentTimeline } = get();
        if (!currentTimeline || currentTimeline.id !== timelineId) return;
        
        try {
          // Optimistically update the share count
          set({
            currentTimeline: {
              ...currentTimeline,
              social_metrics: {
                ...currentTimeline.social_metrics,
                shares: currentTimeline.social_metrics.shares + 1
              }
            }
          });
          
          // In a real app, make an API call to update the share count
          try {
            // await axiosInstance.post(`/api/timelines/${timelineId}/share`);
            console.log('Incrementing share count for timeline:', timelineId);
          } catch (error) {
            console.error('Error updating share count:', error);
            // If API call fails, revert the optimistic update
            set({
              currentTimeline: {
                ...currentTimeline
              }
            });
          }
        } catch (error: any) {
          set({
            error: error.message || 'Failed to update share count'
          });
        }
      },
      
      clearError: () => {
        set({ error: null });
      },
      
      // Utilities
      getSelectedEvent: () => {
        const { events, selectedEventId } = get();
        return events.find(e => e.id === selectedEventId) || null;
      },
      
      getFilteredEvents: () => {
        const { events, zoomedTimespan } = get();
        if (!zoomedTimespan) return events;
        
        return events.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= zoomedTimespan.start && eventDate <= zoomedTimespan.end;
        });
      }
    }),
    {
      name: 'timeline-storage',
      partialize: (state: TimelineState): TimelineStatePersist => ({
        currentTimeline: state.currentTimeline,
        selectedEventId: state.selectedEventId,
        zoomedTimespan: state.zoomedTimespan
      })
    }
  )
); 