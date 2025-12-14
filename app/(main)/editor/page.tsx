"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Eye, Save, X } from "lucide-react";
import { TimelineInfoStep } from "@/components/timeline-editor/TimelineInfoStep";
import { StatisticsInfoStep } from "@/components/timeline-editor/StatisticsInfoStep";
import { StatisticsDataSourceStep } from "@/components/timeline-editor/StatisticsDataSourceStep";
import { StatisticsDataEntryStep } from "@/components/timeline-editor/StatisticsDataEntryStep";
import { StatisticsChartStyleStep } from "@/components/timeline-editor/StatisticsChartStyleStep";
import { StatisticsGenerateChartsStep } from "@/components/timeline-editor/StatisticsGenerateChartsStep";
import { EditorTabBar } from "@/components/timeline-editor/EditorTabBar";
import { WritingStyleStep, TimelineEvent } from "@/components/timeline-editor/WritingStyleStep";
import { EventDetailsStep } from "@/components/timeline-editor/EventDetailsStep";
import { ImageStyleStep } from "@/components/timeline-editor/ImageStyleStep";
import { GenerateImagesStep } from "@/components/timeline-editor/GenerateImagesStep";
import { EditorErrorBoundary } from "@/components/timeline-editor/EditorErrorBoundary";
import { containsFamousPerson } from "@/lib/utils/famousPeopleHandler";
import { createTimeline, createEvent } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { TimelineCard } from "@/components/timeline/TimelineCard";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toTitleCase } from "@/lib/utils/titleCase";

const STORAGE_KEY = 'timeline-editor-state';

const TimelineEditor = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { isSignedIn, isLoaded } = useUser();
  
  // All hooks must be declared before any conditional returns
  const [currentStep, setCurrentStep] = useState(1);
  const [timelineName, setTimelineName] = useState("");
  const [timelineDescription, setTimelineDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true); // Default to public so timelines appear in discover
  const [isFactual, setIsFactual] = useState(true); // Default to factual timelines
  const [isNumbered, setIsNumbered] = useState(false); // Default to dated events
  const [numberLabel, setNumberLabel] = useState("Day"); // Default label for numbered events
  const [maxEvents, setMaxEvents] = useState(20); // Default to 20 events
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [writingStyle, setWritingStyle] = useState("narrative");
  const [customStyle, setCustomStyle] = useState("");
  const [imageStyle, setImageStyle] = useState("Illustration");
  const [themeColor, setThemeColor] = useState("");
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [imageReferences, setImageReferences] = useState<Array<{ name: string; url: string }>>([]);
  const [sourceRestrictions, setSourceRestrictions] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [includesPeople, setIncludesPeople] = useState(true); // Default to true for backward compatibility
  const [referencePhoto, setReferencePhoto] = useState<{
    file: File | null;
    url: string | null;
    personName: string;
    hasPermission: boolean;
  }>({
    file: null,
    url: null,
    personName: "",
    hasPermission: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [timelineType, setTimelineType] = useState<string | undefined>(); // 'social' or 'statistics'
  
  // Statistics-specific state
  const [statisticsMetrics, setStatisticsMetrics] = useState<string[]>([]); // Up to 8 metrics
  const [statisticsChartType, setStatisticsChartType] = useState<string>('bar'); // bar, pie, line, etc.
  const [statisticsDataSource, setStatisticsDataSource] = useState<string>(''); // Data source name
  const [statisticsDataMode, setStatisticsDataMode] = useState<'ai' | 'manual'>('ai'); // AI or manual entry
  const [statisticsEvents, setStatisticsEvents] = useState<Array<{
    id: string;
    date?: Date;
    number?: number;
    title: string;
    description?: string;
    narrative?: string; // Detailed explanation of trends, causes, and key contributors
    data: Record<string, number>; // Metric name -> value
    chartUrl?: string; // URL of the generated chart image
  }>>([]);
  
  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isSignedIn, isLoaded, router]);

  // Warn user before leaving page if they have unsaved changes
  useEffect(() => {
    if (typeof window === 'undefined') return; // SSR safety check
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if user has generated images that haven't been saved
      const hasGeneratedImages = events.some(e => e.imageUrl);
      const hasUnsavedWork = events.length > 0 || timelineName.trim().length > 0;
      
      // Only warn if there's actual work that could be lost
      if (hasGeneratedImages || (hasUnsavedWork && currentStep > 1)) {
        // Modern browsers ignore custom messages, but we can still trigger the warning
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [events, timelineName, currentStep]);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return; // SSR safety check
      
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        
        // Safely parse dates - handle invalid dates
        let parsedStartDate: Date | undefined;
        let parsedEndDate: Date | undefined;
        
        if (state.startDate) {
          try {
            parsedStartDate = new Date(state.startDate);
            if (isNaN(parsedStartDate.getTime())) {
              parsedStartDate = undefined;
            }
          } catch {
            parsedStartDate = undefined;
          }
        }
        
        if (state.endDate) {
          try {
            parsedEndDate = new Date(state.endDate);
            if (isNaN(parsedEndDate.getTime())) {
              parsedEndDate = undefined;
            }
          } catch {
            parsedEndDate = undefined;
          }
        }
        
        setTimelineName(state.timelineName || "");
        setTimelineDescription(state.timelineDescription || "");
        setIsPublic(state.isPublic !== undefined ? state.isPublic : true);
        setIsFactual(state.isFactual !== undefined ? state.isFactual : true);
        setIsNumbered(state.isNumbered !== undefined ? state.isNumbered : false);
        setNumberLabel(state.numberLabel || "Day");
        setMaxEvents(state.maxEvents !== undefined ? state.maxEvents : 20);
        setStartDate(parsedStartDate);
        setEndDate(parsedEndDate);
        setWritingStyle(state.writingStyle || "");
        setCustomStyle(state.customStyle || "");
        setImageStyle(state.imageStyle || "Illustration");
        setThemeColor(state.themeColor || "");
        setEvents(Array.isArray(state.events) ? state.events : []);
        setImageReferences(Array.isArray(state.imageReferences) ? state.imageReferences : []);
        setSourceRestrictions(Array.isArray(state.sourceRestrictions) ? state.sourceRestrictions : []);
        setHashtags(Array.isArray(state.hashtags) ? state.hashtags : []);
        setIncludesPeople(state.includesPeople !== undefined ? state.includesPeople : true);
        setReferencePhoto(state.referencePhoto && typeof state.referencePhoto === 'object' ? {
          file: null, // File objects can't be stored in localStorage
          url: state.referencePhoto.url || null,
          personName: state.referencePhoto.personName || "",
          hasPermission: state.referencePhoto.hasPermission || false,
        } : {
          file: null,
          url: null,
          personName: "",
          hasPermission: false,
        });
        const loadedStep = typeof state.currentStep === 'number' && state.currentStep >= 1 && state.currentStep <= 6 ? state.currentStep : 1;
        setCurrentStep(loadedStep);
        // Load statistics state if present
        if (state.timelineType === 'statistics') {
          setTimelineType('statistics');
          setStatisticsMetrics(Array.isArray(state.statisticsMetrics) ? state.statisticsMetrics : []);
          setStatisticsChartType(state.statisticsChartType || 'bar');
          setStatisticsDataSource(state.statisticsDataSource || '');
          setStatisticsDataMode(state.statisticsDataMode || 'ai');
          setStatisticsEvents(Array.isArray(state.statisticsEvents) ? state.statisticsEvents : []);
        }
        // Automatically show preview when on step 6
        if (loadedStep === 6) {
          setShowPreview(true);
        }
      }
    } catch (e) {
      console.error('Failed to load saved state:', e);
      // Clear corrupted localStorage data
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore errors when clearing
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return; // SSR safety check
      
      const state = {
        timelineName,
        timelineDescription,
        isPublic,
        isFactual,
        isNumbered,
        numberLabel,
        maxEvents,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        writingStyle,
        customStyle,
        imageStyle,
        themeColor,
        events: Array.isArray(events) ? events : [],
        imageReferences: Array.isArray(imageReferences) ? imageReferences : [],
        sourceRestrictions: Array.isArray(sourceRestrictions) ? sourceRestrictions : [],
        hashtags: Array.isArray(hashtags) ? hashtags : [],
        includesPeople,
        referencePhoto: {
          url: referencePhoto?.url || null,
          personName: referencePhoto?.personName || "",
          hasPermission: referencePhoto?.hasPermission || false,
          // Don't store File object in localStorage
        },
        currentStep,
        timelineType,
        // Statistics-specific state
        statisticsMetrics: Array.isArray(statisticsMetrics) ? statisticsMetrics : [],
        statisticsChartType,
        statisticsDataSource,
        statisticsDataMode,
        statisticsEvents: Array.isArray(statisticsEvents) ? statisticsEvents : [],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
      // If localStorage is full or unavailable, try to clear old data
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore errors when clearing
      }
    }
  }, [timelineName, timelineDescription, isPublic, isFactual, isNumbered, numberLabel, maxEvents, startDate, endDate, writingStyle, customStyle, imageStyle, themeColor, events, imageReferences, sourceRestrictions, hashtags, includesPeople, referencePhoto, currentStep, timelineType, statisticsMetrics, statisticsChartType, statisticsDataSource, statisticsDataMode, statisticsEvents]);

  // Handle Stripe success return and query parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const success = params.get('success');
      const credits = params.get('credits');
      
      if (success === 'true' && credits) {
        // Refresh credits and show success message
        import('@/hooks/use-credits').then(({ useCredits }) => {
          const creditsStore = useCredits.getState();
          creditsStore.fetchCredits().then(() => {
            toast({
              title: "Payment Successful!",
              description: `You've received ${credits} credits. Your balance has been updated.`,
            });
          });
        });
        
        // Remove query params
        router.replace('/editor');
        return;
      }

      // Handle pre-filled data from social or statistics pages
      const title = params.get('title');
      const description = params.get('description');
      const type = params.get('type'); // 'social' or 'statistics'
      
      if (title && description) {
        setTimelineName(title);
        setTimelineDescription(description);
        setTimelineType(type || undefined); // Store timeline type
        
        // Handle social media parameters
        if (type === 'social') {
          const accountSource = params.get('accountSource');
          const platform = params.get('platform');
          if (accountSource) {
            // Add account source to source restrictions
            const sourcePrefix = platform === 'twitter' ? '@' : '';
            setSourceRestrictions([`${sourcePrefix}${accountSource}`]);
          }
        }
        
        // Handle statistics parameters
        if (type === 'statistics') {
          const fields = params.get('fields');
          const chartType = params.get('chartType');
          const dataSource = params.get('dataSource');
          
          if (fields) {
            const fieldsList = fields.split('|').filter(f => f.trim().length > 0);
            setStatisticsMetrics(fieldsList);
            setStatisticsChartType(chartType || 'bar');
            setStatisticsDataSource(dataSource || '');
            // Default to AI mode if data source is provided
            if (dataSource) {
              setStatisticsDataMode('ai');
            }
          }
        }
        
        // Clear query params after processing
        router.replace('/editor');
      }
    }
  }, [router, toast]);

  // Scroll to top on step change (matching design)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Automatically show preview when on step 6
    if (currentStep === 6) {
      setShowPreview(true);
    } else {
      setShowPreview(false);
    }
  }, [currentStep]);

  // Debug: Log imageStyle changes
  useEffect(() => {
    console.log('[Editor] imageStyle changed:', imageStyle);
  }, [imageStyle]);

  // Show loading while checking authentication
  // NOTE: This conditional return must come AFTER all hooks
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const steps = timelineType === 'statistics' ? [
    { number: 1, title: "Metrics Definition" },
    { number: 2, title: "Data Source" },
    { number: 3, title: "Data Entry" },
    { number: 4, title: "Chart Style" },
    { number: 5, title: "Generate Charts" },
    { number: 6, title: "Review & Publish" },
  ] : [
    { number: 1, title: "Timeline Info" },
    { number: 2, title: "Writing Style & Events" },
    { number: 3, title: "Event Details" },
    { number: 4, title: "Image Style" },
    { number: 5, title: "Generate Images" },
    { number: 6, title: "Review & Publish" },
  ];

  const handleNext = () => {
    if (!canProceed()) {
      // Show validation error
      let errorMessage = "Please complete the required fields before proceeding.";
      switch (currentStep) {
        case 1:
          if (timelineType === 'statistics') {
            if (!timelineName || !timelineDescription) {
          errorMessage = "Please provide a timeline name and description.";
            } else if (statisticsMetrics.length === 0 || !statisticsMetrics.every(m => m.trim().length > 0)) {
              errorMessage = "Please define at least one metric to track.";
            }
          } else {
            errorMessage = "Please provide a timeline name and description.";
          }
          break;
        case 2:
          if (timelineType === 'statistics') {
            if (!statisticsDataMode) {
              errorMessage = "Please select a data source method (AI or Manual).";
            } else if (statisticsDataMode === 'ai' && !statisticsDataSource.trim()) {
              errorMessage = "Please provide a data source for AI to search.";
            }
          } else {
          if (!writingStyle && !customStyle) {
            errorMessage = "Please select a writing style or enter a custom style.";
          } else if (events.length === 0) {
            errorMessage = "Please add at least one event (generate with AI or add manually).";
          } else if (!events.every(e => e.title)) {
            errorMessage = "Please add titles to all events.";
            }
          }
          break;
        case 3:
          if (timelineType === 'statistics') {
            if (statisticsEvents.length === 0) {
              errorMessage = "Please generate or add at least one event with data.";
            } else if (!statisticsEvents.every(e => e.title.trim().length > 0)) {
              errorMessage = "Please add titles to all events.";
            } else if (!statisticsEvents.every(e => Object.keys(e.data).length > 0)) {
              errorMessage = "Please add data values for all events.";
            }
          } else {
          errorMessage = "Please add descriptions to all events.";
          }
          break;
        case 4:
          errorMessage = "Please select a preset image style or enter a custom style description.";
          break;
      }
      toast({
        title: "Cannot proceed",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep < 6) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      // Automatically show preview when reaching step 6
      if (nextStep === 6) {
        setShowPreview(true);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleCancel = () => {
    // Clear all state
    setTimelineName("");
    setTimelineDescription("");
    setIsPublic(true);
    setIsFactual(true);
    setIsNumbered(false);
    setNumberLabel("Day");
    setMaxEvents(20);
    setStartDate(undefined);
    setEndDate(undefined);
    setWritingStyle("");
    setCustomStyle("");
    setImageStyle("Illustration");
    setThemeColor("");
    setEvents([]);
    setImageReferences([]);
    setSourceRestrictions([]);
    setHashtags([]);
    setIncludesPeople(true);
    setReferencePhoto({
      file: null,
      url: null,
      personName: "",
      hasPermission: false,
    });
    setCurrentStep(1);
    
    // Reset statistics-specific state
    setTimelineType(undefined);
    setStatisticsMetrics([]);
    setStatisticsChartType('bar');
    setStatisticsDataSource('');
    setStatisticsDataMode('ai');
    setStatisticsEvents([]);
    
    // Clear localStorage
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
    
    // Navigate to home screen
    router.push('/');
  };

  // Detect if any events contain famous people
  const hasFamousPeople = events.some(event => 
    (event.title && containsFamousPerson(event.title)) || 
    (event.description && containsFamousPerson(event.description)) ||
    (event.imagePrompt && containsFamousPerson(event.imagePrompt))
  );

  const canProceed = () => {
    let result = false;
    switch (currentStep) {
      case 1:
        if (timelineType === 'statistics') {
          // For statistics: need name, description, and at least one metric
          result = !!(timelineName && timelineDescription && statisticsMetrics.length > 0 && statisticsMetrics.every(m => m.trim().length > 0));
        } else {
        result = !!(timelineName && timelineDescription);
        }
        break;
      case 2:
        if (timelineType === 'statistics') {
          // For statistics: need data mode selected and data source if AI mode
          result = !!(statisticsDataMode && (statisticsDataMode === 'manual' || statisticsDataSource.trim().length > 0));
        } else {
        result = !!(writingStyle || customStyle) && events.length > 0 && events.every(e => e.title);
        }
        break;
      case 3:
        if (timelineType === 'statistics') {
          // For statistics: need at least one event with data
          result = statisticsEvents.length > 0 && statisticsEvents.every(e => 
            e.title.trim().length > 0 && 
            Object.keys(e.data).length > 0 &&
            statisticsMetrics.every(m => typeof e.data[m] === 'number')
          );
        } else {
        result = events.every(e => e.description);
        }
        break;
      case 4:
        if (timelineType === 'statistics') {
          // For statistics: need chart type selected
          result = !!(statisticsChartType && statisticsChartType.trim().length > 0);
        } else {
          // Accept either preset style or custom style (from ImageStyleStep's customStyle textarea)
          // ImageStyleStep syncs customStyle to imageStyle via useEffect, so check imageStyle
          result = !!(imageStyle && imageStyle.trim().length > 0);
        }
        console.log('[canProceed] Step 4 validation:', { 
          timelineType, 
          statisticsChartType, 
          imageStyle, 
          result 
        });
        break;
      case 5:
        if (timelineType === 'statistics') {
          // For statistics: need ALL charts generated (not just some)
          const eventsWithCharts = statisticsEvents.filter(e => e.chartUrl).length;
          result = statisticsEvents.length > 0 && eventsWithCharts === statisticsEvents.length;
          console.log('[canProceed] Step 5 statistics:', {
            totalEvents: statisticsEvents.length,
            eventsWithCharts,
            result,
            events: statisticsEvents.map(e => ({ id: e.id, title: e.title, hasChartUrl: !!e.chartUrl }))
          });
        } else {
          // Step 5: Can proceed only if at least one image has been generated
          result = events.some(e => e.imageUrl);
        }
        break;
      default:
        result = true;
    }
    console.log('[canProceed] Step', currentStep, 'result:', result);
    return result;
  };

  const handleSaveTimeline = async () => {
    setIsSaving(true);
    try {
      const eventsToSave = timelineType === 'statistics' ? statisticsEvents : events;
      
      // Validate that we have events to save
      if (eventsToSave.length === 0) {
        toast({
          title: "No Events",
          description: "Please add at least one event before saving the timeline.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
      
      console.log('[Timeline Save] Starting timeline creation...', { 
        title: timelineName, 
        eventCount: eventsToSave.length,
        timelineType,
      });

      // Create timeline
      const timelineResult = await createTimeline({
        title: toTitleCase(timelineName),
        description: timelineDescription,
        visualization_type: timelineType === 'statistics' ? "vertical" : "vertical",
        is_public: isPublic,
        is_collaborative: false,
        is_numbered: timelineType === 'statistics' ? false : isNumbered,
        number_label: timelineType === 'statistics' ? null : (isNumbered ? numberLabel : null),
        start_date: timelineType === 'statistics' ? null : (startDate?.toISOString() || null),
        end_date: timelineType === 'statistics' ? null : (endDate?.toISOString() || null),
        hashtags: hashtags.length > 0 ? hashtags : undefined,
      });

      console.log('[Timeline Save] Timeline creation result:', timelineResult);

      if (timelineResult.error || !timelineResult.data) {
        const errorMsg = timelineResult.error || "Failed to create timeline";
        console.error('[Timeline Save] Timeline creation failed:', errorMsg);
        throw new Error(errorMsg);
      }

      const timelineId = timelineResult.data.id;
      console.log('[Timeline Save] Timeline created successfully, ID:', timelineId);

      // Create all events
      const eventResults = [];
      const eventsList = timelineType === 'statistics' ? statisticsEvents : events;
      
      for (const event of eventsList) {
        try {
          let dateStr: string;
          let eventTitle: string;
          let eventDescription: string;
          let imageUrl: string | undefined;
          let imagePrompt: string | undefined;
          let eventNumber: number | undefined;
          let eventNumberLabel: string | undefined;
          
          if (timelineType === 'statistics') {
            // Statistics event handling
            const statsEvent = event as typeof statisticsEvents[0];
            eventTitle = toTitleCase(statsEvent.title);
            eventDescription = statsEvent.description || "";
            
            // Use date if provided, otherwise use current date as placeholder
            if (statsEvent.date) {
              const { formatDateForDB } = await import('@/lib/utils/dateFormat');
              const eventDate = new Date(statsEvent.date);
              dateStr = formatDateForDB(
                eventDate.getFullYear(),
                eventDate.getMonth() + 1,
                eventDate.getDate()
              );
            } else {
              // Use current date as placeholder
              const { formatDateForDB } = await import('@/lib/utils/dateFormat');
              dateStr = formatDateForDB(new Date().getFullYear(), 1, 1);
            }
            
            // For statistics timelines, we use client-side animated charts
            // Don't store chartUrl in image_url - charts are rendered from data
            // Only store if it's an actual URL (not 'client-side' marker)
            imageUrl = statsEvent.chartUrl && statsEvent.chartUrl !== 'client-side' 
              ? statsEvent.chartUrl 
              : undefined;
            
            // Store statistics data in description (we'll enhance this later with proper schema)
            // Ensure JSON is properly formatted (no extra whitespace, proper escaping)
            const statsData = JSON.stringify({
              metrics: statisticsMetrics,
              data: statsEvent.data,
              chartType: statisticsChartType,
            });
            // Include narrative if available
            const narrativeText = (statsEvent as any).narrative 
              ? `\n\n[STATS_NARRATIVE:${JSON.stringify({ narrative: (statsEvent as any).narrative })}]`
              : '';
            // Place STATS_DATA at the end to avoid parsing issues with description content
            eventDescription = eventDescription 
              ? `${eventDescription}${narrativeText}\n\n[STATS_DATA:${statsData}]`
              : `${narrativeText}\n\n[STATS_DATA:${statsData}]`;
          } else {
            // Regular event handling
            const regularEvent = event as TimelineEvent;
            eventTitle = toTitleCase(regularEvent.title);
            eventDescription = regularEvent.description || "";
            
            if (isNumbered && regularEvent.number) {
              // For numbered events, use year 1 as placeholder (DB requires a date)
              dateStr = `1-01-01`; // Placeholder date for numbered events
              eventNumber = regularEvent.number;
              eventNumberLabel = regularEvent.numberLabel;
            } else {
              // Format date: only include month/day if they are actually provided
              const hasMonth = (regularEvent as any).month && (regularEvent as any).month >= 1 && (regularEvent as any).month <= 12;
              const hasDay = (regularEvent as any).day && (regularEvent as any).day >= 1 && (regularEvent as any).day <= 31;
              
              const month = (hasMonth && hasDay) ? (regularEvent as any).month : undefined;
              const day = (hasMonth && hasDay) ? (regularEvent as any).day : undefined;
              
              const { formatDateForDB } = await import('@/lib/utils/dateFormat');
              dateStr = formatDateForDB(regularEvent.year || new Date().getFullYear(), month, day);
            }
            
            imageUrl = regularEvent.imageUrl || undefined;
            imagePrompt = regularEvent.imagePrompt || undefined;
          }

          const eventResult = await createEvent(timelineId, {
            title: eventTitle,
            description: eventDescription,
            date: dateStr,
            number: eventNumber,
            number_label: eventNumberLabel,
            image_url: imageUrl,
            image_prompt: imagePrompt,
          });

          // Log if image/chart is missing
          if (!imageUrl) {
            console.warn(`[Timeline Save] Event "${eventTitle}" created without ${timelineType === 'statistics' ? 'chart' : 'image'} URL`);
          } else {
            console.log(`[Timeline Save] Event "${eventTitle}" created with ${timelineType === 'statistics' ? 'chart' : 'image'}: ${imageUrl.substring(0, 50)}...`);
          }

          eventResults.push({ success: true, event: eventTitle });
        } catch (eventError: any) {
          const eventTitle = timelineType === 'statistics' 
            ? (event as typeof statisticsEvents[0]).title 
            : (event as TimelineEvent).title;
          console.error(`Failed to create event "${eventTitle}":`, eventError);
          eventResults.push({ 
            success: false, 
            event: event.title, 
            error: eventError.message || 'Unknown error' 
          });
        }
      }

      // Check if any events failed
      const failedEvents = eventResults.filter(r => !r.success);
      const successfulEvents = eventResults.filter(r => r.success);
      
      // Count events with images/charts (use eventsList which is the actual list we saved)
      const eventsWithImages = timelineType === 'statistics'
        ? eventsList.filter((e: any) => e.chartUrl && e.chartUrl !== 'client-side').length
        : eventsList.filter((e: any) => e.imageUrl).length;
      const eventsWithoutImages = eventsList.length - eventsWithImages;
      
      console.log(`[Timeline Save] Events summary: ${successfulEvents.length} successful, ${failedEvents.length} failed`);
      console.log(`[Timeline Save] Events with ${timelineType === 'statistics' ? 'charts' : 'images'}: ${eventsWithImages} of ${eventsList.length}`);
      
      if (eventsWithoutImages > 0 && timelineType !== 'statistics') {
        console.warn(`[Timeline Save] ⚠️  WARNING: ${eventsWithoutImages} events are missing images!`);
        console.warn(`[Timeline Save] Events without images:`, 
          eventsList.filter((e: any) => !e.imageUrl).map((e: any) => e.title)
        );
      }
      
      if (failedEvents.length > 0) {
        console.warn('[Timeline Save] Failed events:', failedEvents);
        toast({
          title: "Warning",
          description: `Timeline created but ${failedEvents.length} event(s) failed to save.`,
          variant: "destructive",
        });
      }

      if (successfulEvents.length === eventsList.length) {
      toast({
        title: "Success!",
          description: "Timeline saved successfully",
        });
      } else {
        toast({
          title: "Partially Saved",
          description: `Timeline created with ${successfulEvents.length}/${eventsList.length} events saved.`,
        });
      }

      // Clear saved state since timeline is saved
      localStorage.removeItem(STORAGE_KEY);

      // Navigate to timeline view
      setTimeout(() => {
        router.push(`/timeline/${timelineId}`);
      }, 1000);
    } catch (error: any) {
      console.error("[Timeline Save] Error saving timeline:", error);
      console.error("[Timeline Save] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      toast({
        title: "Error",
        description: error.message || "Failed to save timeline. Please check the console for details.",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };

  const handlePreviewTimeline = () => {
    setShowPreview(!showPreview);
  };

  // Transform events for preview
  const previewEvents = timelineType === 'statistics' 
    ? statisticsEvents.map(e => ({
        id: e.id,
        year: e.date ? new Date(e.date).getFullYear() : undefined,
        title: e.title,
        description: e.description || "",
        category: undefined,
        image: e.chartUrl || "",
        video: "",
        data: e.data, // Include data for statistics preview
      }))
    : events.map(e => ({
        id: e.id,
        year: e.year,
        title: e.title,
        description: e.description || "",
        category: undefined,
        image: e.imageUrl || "",
        video: "",
      }));

  return (
    <EditorErrorBoundary>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <Toaster />
        
        <main className="flex-1 container mx-auto px-4 pt-16 pb-32 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Create a Timeline</h1>
        </div>

        {/* Step Content */}
        {currentStep === 6 ? (
          // Step 6: Show preview directly
          <Card className="p-6 mb-6">
            <div className="mb-6">
              <h2 className="text-2xl font-display font-semibold mb-2">{steps[currentStep - 1]?.title || "Review & Publish"}</h2>
              <p className="text-muted-foreground mb-4">
                Review your timeline and publish it when ready.
              </p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-display font-semibold mb-2">{timelineName}</h3>
              <p className="text-muted-foreground">{timelineDescription}</p>
            </div>
            <div className="space-y-8">
              {previewEvents.map((event) => (
                <div key={event.id} className="space-y-3">
                  <div>
                    <h4 className="text-lg font-semibold mb-1">
                      {event.year ? `${event.year} - ` : ''}{toTitleCase(event.title)}
                    </h4>
                    {event.description && (
                      <p className="text-muted-foreground">{event.description}</p>
                    )}
                  </div>
                  {event.image && (
                    <div className="w-full">
                      {timelineType === 'statistics' ? (
                        <div className="space-y-4">
                          <div className="w-full bg-muted/30 rounded-lg p-4">
                            <img
                              src={event.image}
                              alt={`Chart for ${event.title}`}
                              className="w-full h-auto rounded-lg object-contain max-h-[60vh] mx-auto"
                            />
                          </div>
                          {timelineType === 'statistics' && 'data' in event && event.data ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-muted/30 rounded-lg">
                              {statisticsMetrics.map((metric) => {
                                const eventData = event.data as Record<string, number>;
                                return (
                                  <div key={metric} className="text-sm">
                                    <span className="text-muted-foreground">{metric}:</span>{' '}
                                    <span className="font-medium">{eventData[metric] ?? 0}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-auto rounded-lg object-contain max-h-[80vh]"
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ) : (
            <Card className="p-6 mb-6">
                  {currentStep === 1 && (
                    timelineType === 'statistics' ? (
                      <StatisticsInfoStep
                        timelineName={timelineName}
                        setTimelineName={setTimelineName}
                        timelineDescription={timelineDescription}
                        setTimelineDescription={setTimelineDescription}
                        isPublic={isPublic}
                        setIsPublic={setIsPublic}
                        metrics={statisticsMetrics}
                        setMetrics={setStatisticsMetrics}
                      />
                    ) : (
                    <TimelineInfoStep
                      timelineName={timelineName}
                      setTimelineName={setTimelineName}
                      timelineDescription={timelineDescription}
                      setTimelineDescription={setTimelineDescription}
                      isPublic={isPublic}
                      setIsPublic={setIsPublic}
                      isFactual={isFactual}
                      setIsFactual={setIsFactual}
                      isNumbered={isNumbered}
                      setIsNumbered={setIsNumbered}
                      numberLabel={numberLabel}
                      setNumberLabel={setNumberLabel}
                      maxEvents={maxEvents}
                      setMaxEvents={setMaxEvents}
                      startDate={startDate}
                      setStartDate={setStartDate}
                      endDate={endDate}
                      setEndDate={setEndDate}
                      sourceRestrictions={sourceRestrictions}
                      setSourceRestrictions={setSourceRestrictions}
                      referencePhoto={referencePhoto}
                      setReferencePhoto={setReferencePhoto}
                      hashtags={hashtags}
                      setHashtags={setHashtags}
                    />
                    )
                  )}
              {currentStep === 2 && (
                timelineType === 'statistics' ? (
                  <StatisticsDataSourceStep
                    dataMode={statisticsDataMode}
                    setDataMode={setStatisticsDataMode}
                    dataSource={statisticsDataSource}
                    setDataSource={setStatisticsDataSource}
                    metrics={statisticsMetrics}
                    timelineName={timelineName}
                    timelineDescription={timelineDescription}
                  />
                ) : (
                <WritingStyleStep
                  writingStyle={writingStyle}
                  setWritingStyle={setWritingStyle}
                  customStyle={customStyle}
                  setCustomStyle={setCustomStyle}
                  events={events}
                  setEvents={setEvents}
                  timelineDescription={timelineDescription}
                  timelineName={timelineName}
                  isFactual={isFactual}
                  isNumbered={isNumbered}
                  numberLabel={numberLabel}
                  maxEvents={maxEvents}
                  setImageReferences={setImageReferences}
                  sourceRestrictions={sourceRestrictions}
                />
                )
              )}
              {currentStep === 3 && (
                timelineType === 'statistics' ? (
                  <StatisticsDataEntryStep
                    dataMode={statisticsDataMode}
                    metrics={statisticsMetrics}
                    events={statisticsEvents}
                    setEvents={setStatisticsEvents}
                    timelineName={timelineName}
                    timelineDescription={timelineDescription}
                    dataSource={statisticsDataSource}
                  />
                ) : (
                <EventDetailsStep 
                  events={events} 
                  setEvents={setEvents}
                  timelineDescription={timelineDescription}
                  timelineName={timelineName}
                  writingStyle={writingStyle}
                  imageStyle={imageStyle} // Pass if already selected (user may have gone back)
                  themeColor={themeColor} // Pass if already selected
                  sourceRestrictions={sourceRestrictions}
                  hashtags={hashtags}
                  setHashtags={setHashtags}
                />
                )
              )}
              {currentStep === 4 && (
                timelineType === 'statistics' ? (
                  <StatisticsChartStyleStep
                    chartType={statisticsChartType}
                    setChartType={setStatisticsChartType}
                    themeColor={themeColor}
                    setThemeColor={setThemeColor}
                    metrics={statisticsMetrics}
                  />
                ) : (
                  <ImageStyleStep 
                    imageStyle={imageStyle}
                    setImageStyle={setImageStyle}
                    themeColor={themeColor}
                    setThemeColor={setThemeColor}
                    hasRealPeople={isFactual && (imageReferences.length > 0 || hasFamousPeople)}
                  />
                )
              )}
              {currentStep === 5 && (
                timelineType === 'statistics' ? (
                  <StatisticsGenerateChartsStep
                    events={statisticsEvents}
                    setEvents={setStatisticsEvents}
                    metrics={statisticsMetrics}
                    chartType={statisticsChartType}
                    themeColor={themeColor}
                    timelineName={timelineName}
                  />
                ) : (
                  <GenerateImagesStep 
                    events={events} 
                    setEvents={setEvents}
                    imageStyle={imageStyle}
                    setImageStyle={setImageStyle}
                    themeColor={themeColor}
                    setThemeColor={setThemeColor}
                    imageReferences={imageReferences}
                    referencePhoto={referencePhoto}
                    includesPeople={includesPeople}
                    hasSelectedImageStyle={currentStep > 4} // True if user has been to step 4
                  />
                )
              )}
            </Card>
        )}
        </main>
        
        {/* Fixed Bottom Tab Bar */}
        <EditorTabBar
          currentStep={currentStep}
          totalSteps={6}
          canProceed={canProceed()}
          isSaving={isSaving}
          showPreview={showPreview}
          onBack={handleBack}
          onNext={handleNext}
          onCancel={handleCancel}
          onPreview={handlePreviewTimeline}
          onSave={handleSaveTimeline}
        />
      </div>
    </EditorErrorBoundary>
  );
};

export default TimelineEditor;
