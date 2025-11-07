# Timeline Seeding File Format

This document describes the format for seeding timelines into StoryWall.

## File Format: JSON

The seed file should be a JSON array of user objects, each containing an array of timelines to create.

## Example Seed File

```json
[
  {
    "user": {
      "email": "user1@example.com",
      "username": "user1",
      "clerkId": "user_abc123" // Optional: if provided, will use existing Clerk user
    },
    "timelines": [
      {
        "title": "The History of Space Exploration",
        "description": "Key milestones in human space exploration from the first satellite to modern missions",
        "isFactual": true,
        "isPublic": true,
        "maxEvents": 20,
        "generateImages": true,
        "imageStyle": "realistic" // Optional: "realistic", "illustrated", "minimalist", "vintage"
      },
      {
        "title": "The Evolution of Computing",
        "description": "Major developments in computer technology from the abacus to quantum computing",
        "isFactual": true,
        "isPublic": true,
        "maxEvents": 20,
        "generateImages": true
      }
      // ... up to 20 timelines per user
    ]
  },
  {
    "user": {
      "email": "user2@example.com",
      "username": "user2"
    },
    "timelines": [
      // ... 20 timelines
    ]
  }
  // ... up to 10 users
]
```

## Required Fields

### User Object
- `email` (string, required): User's email address
- `username` (string, required): Unique username
- `clerkId` (string, optional): If provided, will link to existing Clerk user

### Timeline Object
- `title` (string, required): Timeline title
- `description` (string, required): Description/prompt for AI to generate events
- `isFactual` (boolean, default: true): Whether timeline is factual or fictional
- `isPublic` (boolean, default: true): Whether timeline is public
- `maxEvents` (number, default: 20): Maximum number of events to generate
- `generateImages` (boolean, default: false): Whether to generate images for events
- `imageStyle` (string, optional): Image style if generating images

## Process Flow

1. **User Creation**: Creates users in the database (or uses existing if clerkId provided)
2. **Timeline Creation**: Creates timeline record in database
3. **Event Generation**: Uses AI to generate events based on description
4. **Event Saving**: Saves all generated events to the timeline
5. **Image Generation** (optional): Generates images for each event if requested
6. **Image Saving**: Updates events with generated image URLs

## Notes

- The seeding process is asynchronous and may take significant time (especially with image generation)
- Each timeline generation uses AI credits
- Image generation is optional but recommended for better visual appeal
- The process will continue even if individual timelines fail (errors are logged)

