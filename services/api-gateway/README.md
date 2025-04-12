# API Gateway Service

The API Gateway serves as the entry point for all client requests in the StoryWall application. It handles request routing, authentication verification, and cross-cutting concerns like rate limiting and logging.

## Features

- Request routing to microservices
- JWT validation
- Rate limiting
- Response caching
- Request logging
- Swagger API documentation

## API Endpoints

### Authentication

#### `POST /api/auth/login`

Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "email": "user@example.com",
    "username": "username",
    "name": "User Name"
  }
}
```

#### `POST /api/auth/register`

Registers a new user.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "username": "newuser",
  "name": "New User"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "email": "newuser@example.com",
    "username": "newuser",
    "name": "New User"
  }
}
```

### Timeline Management

#### `GET /api/timelines`

Retrieves a list of timelines for the authenticated user.

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of timelines per page
- `sort` (optional): Sort field, default is `-createdAt`

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

### Events Management

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

## Configuration

The API Gateway service can be configured using environment variables:

```
# Server Configuration
PORT=3002
NODE_ENV=development

# Service URLs
USER_SERVICE_URL=http://localhost:3000
TIMELINE_SERVICE_URL=http://localhost:3001

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:8080,http://localhost:4000

# Service Monitoring
SERVICE_CHECK_INTERVAL=30000 # milliseconds

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000 # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

## Development

### Installation

```bash
cd services/api-gateway
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