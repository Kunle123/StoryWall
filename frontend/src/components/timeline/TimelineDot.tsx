import React from 'react';
import { TimelineEvent } from '../../stores/timelineStore';

interface TimelineDotProps {
  event: TimelineEvent;
  position: { x: number, y: number };
  isSelected: boolean;
  onClick: (id: string) => void;
}

/**
 * Reusable timeline dot component that represents an event on a timeline
 * Used by both circular and horizontal timelines
 */
const TimelineDot: React.FC<TimelineDotProps> = React.memo(({
  event, 
  position, 
  isSelected, 
  onClick
}) => (
  <g 
    className={`timeline-dot ${isSelected ? 'selected' : ''}`}
    data-event-id={event.id}
  >
    {/* Visible dot */}
    <circle
      cx={position.x}
      cy={position.y}
      r={isSelected ? 8 : 5}
      fill={isSelected ? "var(--selected-color, #ff5555)" : "var(--unselected-color, #ff9999)"}
      stroke={isSelected ? "var(--selected-stroke, #cc0000)" : "var(--unselected-stroke, #cc5555)"}
      strokeWidth={1}
      role="button"
      aria-selected={isSelected}
      tabIndex={0}
      style={{
        transition: 'r 0.3s ease, fill 0.3s ease',
        cursor: 'pointer'
      }}
    />

    {/* Larger hit area for better usability */}
    <circle
      cx={position.x}
      cy={position.y}
      r={15} // Larger hit area
      fill="transparent"
      onClick={(e) => {
        e.stopPropagation();
        onClick(event.id);
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick(event.id);
          e.preventDefault();
        }
      }}
      style={{ cursor: 'pointer' }}
      aria-label={`Select event: ${event.title}, ${new Date(event.date).toLocaleDateString()}`}
      aria-hidden="true"
    />
  </g>
));

export default TimelineDot; 