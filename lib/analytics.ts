/**
 * Google Analytics utility functions for tracking events
 * 
 * This module provides helper functions to track custom events in Google Analytics.
 * All functions check if Google Analytics is available before tracking.
 */

declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'set',
      targetId: string | object,
      config?: object
    ) => void;
  }
}

/**
 * Check if Google Analytics is loaded and available
 */
function isGAAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/**
 * Track a custom event in Google Analytics
 * 
 * @param eventName - The name of the event (e.g., 'timeline_created', 'tweet_posted')
 * @param eventParams - Additional parameters for the event
 * 
 * @example
 * trackEvent('timeline_created', {
 *   timeline_id: '123',
 *   event_count: 10,
 *   has_image: true
 * });
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, string | number | boolean>
): void {
  if (!isGAAvailable()) {
    console.debug('[Analytics] Google Analytics not available, skipping event:', eventName);
    return;
  }

  try {
    window.gtag!('event', eventName, {
      ...eventParams,
      // Add timestamp for debugging
      timestamp: new Date().toISOString(),
    });
    console.debug('[Analytics] Tracked event:', eventName, eventParams);
  } catch (error) {
    console.error('[Analytics] Error tracking event:', error);
  }
}

/**
 * Track page views (usually handled automatically by Next.js, but can be used for custom tracking)
 * 
 * @param pagePath - The path of the page (e.g., '/timeline/123')
 * @param pageTitle - Optional page title
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (!isGAAvailable()) {
    return;
  }

  try {
    window.gtag!('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '', {
      page_path: pagePath,
      page_title: pageTitle,
    });
  } catch (error) {
    console.error('[Analytics] Error tracking page view:', error);
  }
}

/**
 * Track user sign-up
 */
export function trackSignUp(method: 'email' | 'google' | 'github' = 'email'): void {
  trackEvent('sign_up', {
    method,
  });
}

/**
 * Track timeline creation
 */
export function trackTimelineCreated(timelineId: string, eventCount: number, hasImage: boolean): void {
  trackEvent('timeline_created', {
    timeline_id: timelineId,
    event_count: eventCount,
    has_image: hasImage,
  });
}

/**
 * Track timeline view
 */
export function trackTimelineViewed(timelineId: string): void {
  trackEvent('timeline_viewed', {
    timeline_id: timelineId,
  });
}

/**
 * Track tweet posted
 */
export function trackTweetPosted(hasImage: boolean, hasHashtags: boolean): void {
  trackEvent('tweet_posted', {
    has_image: hasImage,
    has_hashtags: hasHashtags,
  });
}

/**
 * Track credit purchase
 */
export function trackCreditPurchase(amount: number, credits: number, currency: string = 'USD'): void {
  trackEvent('purchase', {
    value: amount,
    currency,
    credits,
  });
}

/**
 * Track AI generation (timeline events)
 */
export function trackAIGeneration(type: 'events' | 'descriptions' | 'images', count: number): void {
  trackEvent('ai_generation', {
    type,
    count,
  });
}

/**
 * Track image upload
 */
export function trackImageUpload(source: 'user' | 'ai', size: number): void {
  trackEvent('image_uploaded', {
    source,
    size_bytes: size,
  });
}

/**
 * Track search performed
 */
export function trackSearch(query: string, resultCount: number): void {
  trackEvent('search', {
    search_term: query,
    result_count: resultCount,
  });
}

