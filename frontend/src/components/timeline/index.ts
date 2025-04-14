/**
 * Timeline component exports for easier imports
 */

// First import the TimelineContainer component so it can be re-exported as default
import TimelineContainer from './TimelineContainer';

// Main container that manages timeline visualization
export { default as TimelineContainer } from './TimelineContainer';

// Individual timeline visualizations 
export { default as CircularDialTimeline } from './CircularDialTimeline';
export { default as HorizontalTimeline } from './HorizontalTimeline';
export { default as EventDetail } from './EventDetail';

// Utility components
export { default as TimelineDot } from './TimelineDot';

// Types
export * from './types';

// Default export the main container component
export default TimelineContainer; 