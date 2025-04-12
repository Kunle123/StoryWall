# TimelineAI Development Context Management Guidelines

This document provides essential guidelines for AI developers working on the TimelineAI application to effectively manage context window limitations. These guidelines should be added to the Master AI Development Prompt to ensure all AI developers follow consistent practices.

## Quick Reference Guide

### Essential Context Management Commands
- `!focus [component_name]` - Declare focus on a specific component
- `!load_interface [component_name]` - Load a component's interface contract
- `!close_file [file_name]` - Explicitly remove a file from context
- `!summarize_progress` - Generate a summary of current development status
- `!verify_interface` - Check current implementation against interface contract
- `!next_chunk` - Move to the next implementation chunk
- `!end_session` - Explicitly end the current development session

### Development Session Structure
1. **Session Initialization**
   ```
   !focus [ComponentName]
   !load_interface [ComponentName]
   !load_interface [DependencyComponent]  # Only if needed
   
   # Define session goals (2-3 specific tasks)
   # Review current implementation status
   ```

2. **Implementation Phase**
   ```
   !focus_chunk "[ChunkName]"
   
   # Implement chunk
   # Test chunk
   # Document chunk
   
   !close_file [completed_file]  # When moving to next file
   ```

3. **Session Closure**
   ```
   !verify_interface
   !summarize_progress
   !end_session
   ```

## Context Management Rules

### Priority 1: Essential Rules (Must Follow)
1. Work on only ONE component in a single development session
2. Divide implementation into logical chunks of 100-200 lines of code
3. Limit active files to a maximum of 3-5 files per development session
4. Begin development by fully understanding the component's interface contract
5. Begin each session with a "context primer" that includes component responsibility, status, goals, and interface requirements

### Priority 2: Important Rules (Strongly Recommended)
1. Write tests immediately after implementing each feature, not at the end
2. Create simplified mock implementations of dependencies early
3. Use a consistent file structure across all components
4. Maintain a component completion checklist

### Priority 3: Best Practices (When Possible)
1. Document each function/method immediately after implementation
2. Periodically reload interface contracts to ensure compliance
3. Maintain a development journal to track decisions and progress

## Implementation Chunking Strategy

For each component, create a "chunk map" dividing implementation into 5-10 logical chunks:

**Example for Circular Timeline Component:**
```
1. Basic circle rendering (SVG/Canvas setup, arc drawing)
2. Event positioning calculation (date-to-angle mapping)
3. Event marker rendering (markers with importance visualization)
4. Selection and highlighting (event selection, visual feedback)
5. Zoom indicator (visualizing the zoomed portion)
6. Animation and transitions (smooth state changes)
7. Accessibility features (keyboard navigation, ARIA attributes)
```

## Interface Management

Create a simplified interface summary (50-100 words maximum) for quick reference:

**Example:**
```
CircularTimelineComponent: Renders 300-degree timeline with events.
- render(container: HTMLElement, timeline: Timeline): void
- selectEvent(eventId: string): void
- getSelectedEventId(): string | null
- updateZoomIndicator(range: ZoomRange): void
- addEventListener(event: TimelineEvent, callback: Function): void
```

## Context Window Management Techniques

1. **Use explicit context clearing**: When switching topics or components, use `!end_session` and start fresh
2. **Prioritize interface over implementation**: Focus on the contract, not the internal details
3. **Implement incrementally**: Complete one feature before moving to the next
4. **Document as you go**: Add documentation immediately after implementation
5. **Use consistent file structure**: Follow the same patterns across components

By following these guidelines, AI developers can effectively manage context window limitations while ensuring high-quality, compliant component implementations for the TimelineAI application.
