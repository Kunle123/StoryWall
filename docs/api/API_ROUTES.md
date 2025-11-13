# API Routes Documentation

All API routes are ready and working with the PostgreSQL database. Authentication is currently disabled (using placeholder user IDs) until Clerk is configured.

## Base URL
- Local: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Routes

### Timelines

#### `GET /api/timelines`
List all timelines with optional filters.

**Query Parameters:**
- `limit` (number): Number of results (default: 20)
- `offset` (number): Pagination offset (default: 0)
- `is_public` (boolean): Filter by public/private
- `creator_id` (string): Filter by creator

**Example:**
```bash
GET /api/timelines?limit=10&is_public=true
```

#### `POST /api/timelines`
Create a new timeline.

**Request Body:**
```json
{
  "title": "My Timeline",
  "description": "Optional description",
  "visualization_type": "horizontal", // or "vertical" or "grid"
  "is_public": true,
  "is_collaborative": false
}
```

**Response:** Created timeline object

#### `GET /api/timelines/[id]`
Get a timeline by ID with all events and categories.

**Response:** Timeline object with nested events and categories

#### `PATCH /api/timelines/[id]`
Update a timeline (requires ownership).

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "visualization_type": "vertical",
  "is_public": false,
  "is_collaborative": true
}
```

#### `DELETE /api/timelines/[id]`
Delete a timeline (requires ownership).

**Response:** `{ "message": "Timeline deleted successfully" }`

---

### Events

#### `GET /api/timelines/[id]/events`
Get all events for a timeline.

**Response:** Array of event objects

#### `POST /api/timelines/[id]/events`
Create a new event in a timeline.

**Request Body:**
```json
{
  "title": "Event Title",
  "description": "Event description",
  "date": "2024-01-15", // YYYY-MM-DD format
  "end_date": "2024-01-20", // Optional
  "image_url": "https://example.com/image.jpg",
  "location_lat": 40.7128, // Optional
  "location_lng": -74.0060, // Optional
  "location_name": "New York", // Optional
  "category": "milestone", // Optional
  "links": ["https://example.com"] // Optional array
}
```

#### `GET /api/events/[id]`
Get a single event by ID.

#### `PATCH /api/events/[id]`
Update an event (requires ownership or timeline ownership).

**Request Body:** (all fields optional, same as POST)

#### `DELETE /api/events/[id]`
Delete an event (requires ownership or timeline ownership).

---

## Testing the API

You can test these routes using curl, Postman, or your frontend code:

### Example: Create a Timeline
```bash
curl -X POST http://localhost:3000/api/timelines \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Timeline",
    "description": "This is a test timeline",
    "is_public": true
  }'
```

### Example: Create an Event
```bash
curl -X POST http://localhost:3000/api/timelines/[TIMELINE_ID]/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "First Event",
    "date": "2024-01-01",
    "description": "This is the first event"
  }'
```

### Example: Get All Timelines
```bash
curl http://localhost:3000/api/timelines
```

---

## Current Limitations

1. **Authentication**: Currently using placeholder user IDs. When Clerk is configured:
   - Uncomment the `auth()` calls in each route
   - Replace `placeholderUserId` with actual `userId` from Clerk
   - Remove placeholder user ID logic

2. **User Creation**: Before creating timelines, you'll need actual users in the database. You can either:
   - Set up Clerk authentication and sync users
   - Manually create a test user in the database for testing

3. **Slug Uniqueness**: Slug generation handles basic cases, but may need refinement for edge cases.

---

## Next Steps

1. ✅ Database schema created
2. ✅ API routes created
3. ✅ Database helper functions ready
4. ⏳ Connect frontend to use these APIs
5. ⏳ Set up Clerk authentication
6. ⏳ Replace mock data with API calls

