# Master AI Development Prompt for TimelineAI Application

## Overview

You are tasked with developing a component for the TimelineAI application, a mobile-first platform that enables users to create, customize, and share visually appealing timelines using AI-powered content generation. The application features a 300-degree circular timeline visualization with a complementary horizontal zoomed view, robust social sharing capabilities, and sophisticated AI integration.

This development follows a component-based architecture where each component is developed independently by different AI systems. Your task is to develop only the specific component assigned to you while adhering to the interface contracts and isolation strategy defined in this document.

## Component-Based Architecture

The TimelineAI application consists of the following core components:

1. **Circular Timeline Visualization Component**: Renders the 300-degree circular timeline view
2. **Horizontal Timeline Visualization Component**: Renders the zoomed horizontal timeline view
3. **AI Content Generation Component**: Handles AI-powered timeline content creation
4. **Timeline Data Management Component**: Manages timeline and event data storage and retrieval
5. **User Authentication Component**: Handles user authentication and authorization
6. **Social Sharing Component**: Manages timeline sharing and discovery features
7. **Media Management Component**: Handles media uploads, storage, and processing
8. **User Interface Component**: Implements the application's user interface shell

Each component:
- Has a clearly defined responsibility
- Communicates with other components only through well-defined interfaces
- Can be developed and tested independently
- Uses mock implementations for dependencies
- Follows strict isolation principles

## Development Principles

When developing your assigned component, adhere to these principles:

1. **Interface Compliance**: Your implementation must exactly match the interface contract provided.

2. **Isolation**: Your component must function independently with clearly defined inputs and outputs.

3. **Dependency Handling**: Use dependency injection to reference other components only through their interfaces.

4. **Error Handling**: Implement comprehensive error handling for all operations.

5. **Testing**: Create thorough unit, contract, and integration tests.

6. **Documentation**: Provide comprehensive documentation for your component.

7. **Performance**: Ensure your component meets the specified performance criteria.

## Common Types

All components share these common types from the TimelineAI.Common namespace:

```typescript
namespace TimelineAI.Common {
  interface Timeline {
    id: string;
    userId: string;
    title: string;
    description?: string;
    coverImageUrl?: string;
    visibility: 'public' | 'private' | 'unlisted';
    startDate: Date;
    endDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    category?: string;
    tags?: string[];
    settings?: TimelineSettings;
  }

  interface TimelineSettings {
    theme?: string;
    colorScheme?: string;
    defaultView?: 'circular' | 'horizontal';
    showDates?: boolean;
    enableComments?: boolean;
    allowSharing?: boolean;
  }

  interface TimelineEvent {
    id: string;
    timelineId: string;
    title: string;
    description?: string;
    eventDate: Date;
    endDate?: Date;
    mediaUrls?: string[];
    location?: string;
    importance: number;
    createdAt: Date;
    updatedAt: Date;
    sourceUrls?: string[];
    positionDegrees?: number;
    isAiGenerated: boolean;
  }

  interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
      code: string;
      message: string;
    };
  }

  interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}
```

## Component-Specific Instructions

Depending on which component you are assigned to develop, follow the detailed instructions in the corresponding section below:

### Circular Timeline Visualization Component

If you are assigned to develop the Circular Timeline Visualization Component, your task is to implement a visually appealing and interactive 300-degree circular timeline that displays events around a circle. The timeline should be symmetrical along the vertical axis with the gap at the bottom (from 300 to 360 degrees).

Key features include:
- Rendering a 300-degree circular timeline
- Displaying events at their corresponding positions around the circle
- Supporting rotation, zoom, and event selection
- Providing visual indicators for the current time period
- Ensuring responsive design for various screen sizes
- Supporting accessibility features
- Optimizing performance for smooth animations

For detailed instructions, refer to the [Circular Timeline Component Prompt](circular_timeline_component_prompt.md).

### Horizontal Timeline Visualization Component

If you are assigned to develop the Horizontal Timeline Visualization Component, your task is to implement a horizontal timeline view that displays a 30-degree portion of the circular timeline in a traditional linear format. This component provides a detailed view of a specific time period.

Key features include:
- Rendering a horizontal timeline representing a 30-degree portion of the circular timeline
- Displaying events with detailed information and media
- Supporting smooth scrolling and navigation
- Enabling event selection and interaction
- Providing visual indicators for the current view position within the full timeline
- Ensuring responsive design for various screen sizes
- Supporting accessibility features
- Optimizing performance for smooth animations

For detailed instructions, refer to the [Horizontal Timeline Component Prompt](horizontal_timeline_component_prompt.md).

### AI Content Generation Component

If you are assigned to develop the AI Content Generation Component, your task is to implement a sophisticated system that can automatically generate, enhance, and validate timeline content using AI technologies. This component should help users create rich, informative timelines with minimal effort.

Key features include:
- Generating timeline events from user-provided topics or themes
- Enhancing existing timeline events with additional details
- Suggesting related events based on timeline context
- Validating factual accuracy of timeline content
- Generating appropriate media suggestions for events
- Optimizing content for engagement and readability
- Supporting multiple languages and domains
- Ensuring ethical AI use with proper attribution

For detailed instructions, refer to the [AI Content Generation Component Prompt](ai_content_component_prompt.md).

### Timeline Data Management Component

If you are assigned to develop the Timeline Data Management Component, your task is to implement a robust data layer that handles the storage, retrieval, and management of timeline and event data. This component serves as the central data repository for the application.

Key features include:
- CRUD operations for timelines and timeline events
- Efficient querying and filtering of timeline data
- Data validation and integrity checks
- Optimistic updates for improved user experience
- Caching strategies for performance optimization
- Offline data access and synchronization
- Batch operations for bulk data modifications
- Version history and change tracking

For detailed instructions, refer to the [Timeline Data Component Prompt](timeline_data_component_prompt.md).

## Development Process

Follow these steps to develop your assigned component:

1. **Setup Project Structure**
   - Create the directory structure as outlined in your component-specific prompt
   - Initialize package.json and tsconfig.json
   - Set up the necessary dependencies

2. **Define Types and Interfaces**
   - Implement the interface contract in the types directory
   - Create any additional internal types needed

3. **Create Mock Implementations**
   - Implement mocks for the dependencies your component interacts with
   - Ensure mocks provide realistic behavior for testing

4. **Implement Core Functionality**
   - Develop the main features of your component
   - Follow the implementation requirements in your component-specific prompt

5. **Write Tests**
   - Create unit tests for all public methods
   - Implement contract tests to verify interface compliance
   - Add integration tests using mock dependencies

6. **Document Component**
   - Write comprehensive README with usage examples
   - Document public API methods
   - Include implementation notes and design decisions

7. **Optimize and Refine**
   - Review code for performance optimizations
   - Ensure error handling is comprehensive
   - Verify all interface requirements are met

## Deliverables

Your final submission must include:

1. Complete source code for your assigned component
2. Comprehensive test suite
3. Mock implementations of dependencies
4. Documentation as specified in your component-specific prompt
5. Usage examples
6. Package configuration files

## Conclusion

By following this guide, you will create a component that can function independently while ensuring compatibility with the overall TimelineAI application. Your component will be integrated with components developed by other AI systems through the defined interface contracts.

Remember that your component will be evaluated based on:
1. Correct implementation of the interface contract
2. Quality and coverage of tests
3. Completeness of documentation
4. Code quality and performance
5. Adherence to isolation principles
6. Visual appeal and user experience (for UI components)
