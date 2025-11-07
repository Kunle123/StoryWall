# Timeline Seeding Guide

This guide explains how to seed StoryWall with timelines using the automated seeding system.

## Overview

The seeding system allows you to upload a JSON file that will:
1. Create users (or use existing ones)
2. Generate timelines with AI-generated events
3. Optionally generate images for events
4. Save everything to the database

## File Format

See `SEED_FILE_FORMAT.md` for the complete format specification.

### Quick Example

```json
[
  {
    "user": {
      "email": "user1@example.com",
      "username": "user1"
    },
    "timelines": [
      {
        "title": "The History of Space Exploration",
        "description": "Key milestones in human space exploration",
        "isFactual": true,
        "isPublic": true,
        "maxEvents": 20,
        "generateImages": true,
        "imageStyle": "realistic"
      }
    ]
  }
]
```

## Required Data

### User Object
- **email** (string, required): User's email address
- **username** (string, required): Unique username
- **clerkId** (string, optional): If provided, links to existing Clerk user

### Timeline Object
- **title** (string, required): Timeline title
- **description** (string, required): Description/prompt for AI event generation
- **isFactual** (boolean, default: true): Whether timeline is factual or fictional
- **isPublic** (boolean, default: true): Whether timeline is public
- **maxEvents** (number, default: 20): Maximum number of events to generate
- **generateImages** (boolean, default: false): Whether to generate images
- **imageStyle** (string, optional): Image style ("realistic", "illustrated", "minimalist", "vintage")

## Usage Methods

### Method 1: API Endpoint (Recommended)

**POST** `/api/admin/seed`

Send your JSON file as the request body:

```bash
curl -X POST https://your-domain.com/api/admin/seed \
  -H "Content-Type: application/json" \
  -d @seed-data.json
```

Or using a tool like Postman or Insomnia:
1. Create a POST request to `/api/admin/seed`
2. Set Content-Type header to `application/json`
3. Paste your JSON data in the body

### Method 2: Node.js Script

Use the provided script:

```bash
npx ts-node scripts/seed-timelines.ts seed-data.json
```

Or with environment variable:

```bash
SEED_FILE=seed-data.json npx ts-node scripts/seed-timelines.ts
```

## Process Flow

1. **User Creation**: Creates users in database (or uses existing if `clerkId` provided)
2. **Timeline Creation**: Creates timeline record
3. **Event Generation**: Uses AI (GPT-5-mini) to generate events based on description
4. **Event Saving**: Saves all generated events to the timeline
5. **Image Generation** (optional): Generates images using SDXL if requested
6. **Image Saving**: Updates events with generated image URLs

## Response Format

The API returns a summary:

```json
{
  "success": true,
  "summary": {
    "totalUsers": 10,
    "usersCreated": 8,
    "usersSkipped": 2,
    "totalTimelines": 100,
    "timelinesCreated": 95,
    "timelinesFailed": 5,
    "eventsGenerated": 1900,
    "imagesGenerated": 1800,
    "errors": [
      "Timeline \"Example\" (user@example.com): Event generation failed"
    ]
  }
}
```

## Important Notes

### Performance
- Seeding 100 timelines can take **30-60 minutes** (especially with image generation)
- The process is **asynchronous** - individual failures don't stop the entire process
- Each timeline uses AI credits (OpenAI + Replicate)

### Costs
- **Event Generation**: ~$0.25-2.00 per timeline (depending on events)
- **Image Generation**: ~$0.10 per timeline (20 images × $0.0048 each)
- **Total for 100 timelines**: ~$35-210 (depending on image generation)

### Error Handling
- Individual timeline failures are logged but don't stop the process
- Check the `errors` array in the response for details
- Failed timelines are counted in `timelinesFailed`

### Best Practices
1. **Start Small**: Test with 1-2 timelines first
2. **Monitor Costs**: Check your OpenAI and Replicate usage
3. **Descriptive Prompts**: Better descriptions = better events
4. **Skip Images Initially**: Generate images only after verifying events
5. **Unique Usernames**: Ensure usernames are unique across your seed file

## Example: Seeding 100 Timelines

See `example-seed-data.json` for a complete example with 2 users and 40 timelines (20 each).

To create 100 timelines (10 users × 20 timelines):
1. Copy the structure from `example-seed-data.json`
2. Add 8 more user objects
3. Add 20 timelines to each user
4. Save as `seed-100-timelines.json`
5. Run the seeding process

## Troubleshooting

### "Event generation failed"
- Check that `OPENAI_API_KEY` is set
- Verify your API key has sufficient credits
- Check the description is clear and factual (if `isFactual: true`)

### "No events were generated"
- The AI may be uncertain about the topic
- Try a more specific description
- Check if the topic is too recent (may need web search)

### "Image generation failed"
- Check that `REPLICATE_API_TOKEN` is set
- Verify your Replicate account has credits
- Images may fail for famous people (safety filters)

### Users not created
- Check for duplicate emails/usernames
- Verify database connection
- Check Prisma schema matches

## Security Note

⚠️ **The seed endpoint currently has no authentication**. Add admin authentication before using in production:

```typescript
// In app/api/admin/seed/route.ts
const { userId } = await auth();
if (!userId || !isAdmin(userId)) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

