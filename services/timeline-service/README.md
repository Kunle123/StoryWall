# Timeline Service

The Timeline Service is responsible for timeline and event data management in the StoryWall application.

## Features

- Timeline creation and management
- Event management within timelines
- Timeline categorization and tagging
- Timeline sharing permissions
- Timeline content validation

## API Endpoints

### Timeline Management

#### `GET /api/timelines`

Retrieves a list of timelines for the authenticated user.

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of timelines per page
- `sort` (optional): Sort field, default is `-createdAt`
- `tag` (optional): Filter by tag
- `search` (optional): Search in title and description

**Response:**
```json
{
  "timelines": [
    {
      "id": "60d21b4667d0d8992e610c86",
      "title": "My Timeline",
      "description": "A timeline about my life",
      "createdAt": "2023-05-01T12:00:00.000Z",
      "updatedAt": "2023-05-02T12:00:00.000Z",
      "tags": ["personal", "history"],
      "visibility": "public",
      "eventCount": 10
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "totalTimelines": 1
}
```

#### `POST /api/timelines`

Creates a new timeline.

**Request Body:**
```json
{
  "title": "New Timeline",
  "description": "A new timeline about something interesting",
  "tags": ["history", "science"],
  "visibility": "public"
}
```

**Response:**
```json
{
  "id": "60d21b4667d0d8992e610c87",
  "title": "New Timeline",
  "description": "A new timeline about something interesting",
  "createdAt": "2023-05-03T12:00:00.000Z",
  "updatedAt": "2023-05-03T12:00:00.000Z",
  "tags": ["history", "science"],
  "visibility": "public",
  "eventCount": 0
}
```

#### `GET /api/timelines/:id`

Retrieves a specific timeline.

**Response:**
```json
{
  "id": "60d21b4667d0d8992e610c87",
  "title": "New Timeline",
  "description": "A new timeline about something interesting",
  "createdAt": "2023-05-03T12:00:00.000Z",
  "updatedAt": "2023-05-03T12:00:00.000Z",
  "tags": ["history", "science"],
  "visibility": "public",
  "owner": {
    "id": "60d21b4667d0d8992e610c85",
    "username": "username"
  },
  "events": [
    {
      "id": "60d21b4667d0d8992e610c88",
      "title": "Event 1",
      "description": "First event in the timeline",
      "date": "2023-01-01T00:00:00.000Z",
      "createdAt": "2023-05-03T12:30:00.000Z"
    }
  ]
}
```

#### `PUT /api/timelines/:id`

Updates a timeline.

**Request Body:**
```json
{
  "title": "Updated Timeline",
  "description": "Updated description",
  "tags": ["history", "science", "new-tag"],
  "visibility": "private"
}
```

**Response:**
```json
{
  "id": "60d21b4667d0d8992e610c87",
  "title": "Updated Timeline",
  "description": "Updated description",
  "createdAt": "2023-05-03T12:00:00.000Z",
  "updatedAt": "2023-05-03T13:00:00.000Z",
  "tags": ["history", "science", "new-tag"],
  "visibility": "private"
}
```

#### `DELETE /api/timelines/:id`

Deletes a timeline.

**Response:**
```json
{
  "message": "Timeline deleted successfully"
}
```

### Event Management

#### `GET /api/timelines/:id/events`

Retrieves events for a specific timeline.

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of events per page
- `sort` (optional): Sort field, default is `date`
- `startDate` (optional): Filter events after this date
- `endDate` (optional): Filter events before this date

**Response:**
```json
{
  "events": [
    {
      "id": "60d21b4667d0d8992e610c88",
      "title": "Event 1",
      "description": "First event in the timeline",
      "date": "2023-01-01T00:00:00.000Z",
      "createdAt": "2023-05-03T12:30:00.000Z",
      "media": [
        {
          "type": "image",
          "url": "https://example.com/image.jpg"
        }
      ]
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "totalEvents": 1
}
```

#### `POST /api/timelines/:id/events`

Adds an event to a timeline.

**Request Body:**
```json
{
  "title": "New Event",
  "description": "A new event for the timeline",
  "date": "2023-01-02T00:00:00.000Z",
  "media": [
    {
      "type": "image",
      "url": "https://example.com/image.jpg"
    }
  ]
}
```

**Response:**
```json
{
  "id": "60d21b4667d0d8992e610c89",
  "title": "New Event",
  "description": "A new event for the timeline",
  "date": "2023-01-02T00:00:00.000Z",
  "createdAt": "2023-05-03T13:00:00.000Z",
  "media": [
    {
      "type": "image",
      "url": "https://example.com/image.jpg"
    }
  ]
}
```

#### `GET /api/timelines/:timelineId/events/:eventId`

Retrieves a specific event.

**Response:**
```json
{
  "id": "60d21b4667d0d8992e610c89",
  "title": "New Event",
  "description": "A new event for the timeline",
  "date": "2023-01-02T00:00:00.000Z",
  "createdAt": "2023-05-03T13:00:00.000Z",
  "updatedAt": "2023-05-03T13:00:00.000Z",
  "media": [
    {
      "type": "image",
      "url": "https://example.com/image.jpg"
    }
  ]
}
```

#### `PUT /api/timelines/:timelineId/events/:eventId`

Updates a specific event.

**Request Body:**
```json
{
  "title": "Updated Event",
  "description": "Updated description",
  "date": "2023-01-03T00:00:00.000Z"
}
```

**Response:**
```json
{
  "id": "60d21b4667d0d8992e610c89",
  "title": "Updated Event",
  "description": "Updated description",
  "date": "2023-01-03T00:00:00.000Z",
  "createdAt": "2023-05-03T13:00:00.000Z",
  "updatedAt": "2023-05-03T14:00:00.000Z",
  "media": [
    {
      "type": "image",
      "url": "https://example.com/image.jpg"
    }
  ]
}
```

#### `DELETE /api/timelines/:timelineId/events/:eventId`

Deletes a specific event.

**Response:**
```json
{
  "message": "Event deleted successfully"
}
```

### Timeline Sharing

#### `POST /api/timelines/:id/share`

Shares a timeline with other users.

**Request Body:**
```json
{
  "users": ["user1-id", "user2-id"],
  "permissions": "read" // Can be "read" or "edit"
}
```

**Response:**
```json
{
  "message": "Timeline shared successfully"
}
```

#### `GET /api/timelines/:id/share`

Gets sharing information for a timeline.

**Response:**
```json
{
  "shares": [
    {
      "user": {
        "id": "user1-id",
        "username": "user1"
      },
      "permissions": "read"
    },
    {
      "user": {
        "id": "user2-id",
        "username": "user2"
      },
      "permissions": "edit"
    }
  ]
}
```

## Configuration

The Timeline Service can be configured using environment variables:

```
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/storywall-timelines

# External Services
USER_SERVICE_URL=http://localhost:3000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:8080,http://localhost:4000

# Logging
LOG_LEVEL=info
```

## Development

### Installation

```bash
cd services/timeline-service
npm install
```

### Running in Development Mode

```bash
npm run dev
```

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

## API Documentation

The API documentation is available via Swagger UI at `/api-docs` when the service is running. 