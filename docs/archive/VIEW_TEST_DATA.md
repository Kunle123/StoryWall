# How to View Test Data

## 🎯 Quick Access

### Test Timeline Created
- **Timeline ID**: `bd4cd197-77cd-4e51-a6de-d026d0982fc2`
- **Direct URL**: http://localhost:3000/timeline/bd4cd197-77cd-4e51-a6de-d026d0982fc2

### Test User
- **User ID**: `4b499a69-c3f1-48ee-a938-305cce4c19e8`
- **Username**: `testuser`
- **Email**: `test@example.com`

## 📊 Viewing Methods

### 1. Frontend (Web Browser)

#### Homepage
```bash
http://localhost:3000/
```
Shows the first public timeline from the database (if available, otherwise shows mock data).

#### Timeline Detail Page
```bash
http://localhost:3000/timeline/bd4cd197-77cd-4e51-a6de-d026d0982fc2
```
View the specific test timeline with all events.

#### Discover Page
```bash
http://localhost:3000/discover
```
Browse all available timelines (from database + mock data).

#### Story Detail Page
```bash
# Click on any event card to view details
# Or visit directly with event ID:
http://localhost:3000/story/[event-id]
```

### 2. Prisma Studio (Database Browser)

Open a visual database browser:
```bash
npm run db:studio
```

Then navigate to:
- **Users** table → See test user
- **Timelines** table → See test timeline
- **Events** table → See all 5 test events

**Features:**
- Browse all tables
- View/edit data directly
- See relationships between tables
- Filter and search

### 3. API Endpoints

#### Get Timeline
```bash
curl http://localhost:3000/api/timelines/bd4cd197-77cd-4e51-a6de-d026d0982fc2
```

#### List All Timelines
```bash
curl http://localhost:3000/api/timelines
```

#### Get Events for Timeline
```bash
curl http://localhost:3000/api/timelines/bd4cd197-77cd-4e51-a6de-d026d0982fc2/events
```

#### Get Specific Event
```bash
curl http://localhost:3000/api/events/[event-id]
```

### 4. Run API Test Script

See all endpoints in action:
```bash
npm run test:api
```

## 📝 Test Data Created

### Timeline
- **Title**: "Test Timeline - Database Demo"
- **Description**: Full description of the demo timeline
- **5 Events**: 
  1. Project Launch (2024-01-15)
  2. First Timeline Created (2024-02-01)
  3. Database Integration Complete (2024-02-15)
  4. API Routes Live (2024-03-01)
  5. Frontend Integration (2024-03-10)

## 🔄 Recreate Test Data

If you want to create fresh test data:
```bash
npm run test:create-data
```

This script will:
- Check if test user exists (create if needed)
- Create a new timeline if one doesn't exist
- Create 5 sample events

## 🎨 Visual Guide

1. **Start Dev Server** (if not running):
   ```bash
   npm run dev
   ```

2. **Open Browser**:
   - Homepage: http://localhost:3000
   - Discover: http://localhost:3000/discover
   - Your Timeline: http://localhost:3000/timeline/bd4cd197-77cd-4e51-a6de-d026d0982fc2

3. **Or Use Database Browser**:
   ```bash
   npm run db:studio
   ```
   Opens at: http://localhost:5555

## ✨ Tips

- **Homepage** will show database timelines if they exist, otherwise shows mock data
- **Discover page** combines database and mock timelines
- **Timeline detail** page loads from database first, falls back to mock
- All pages work seamlessly with or without database data

## 🐛 Troubleshooting

**Can't see timeline in frontend?**
- Make sure dev server is running: `npm run dev`
- Check browser console for errors
- Verify timeline exists: `npm run db:studio`

**Database empty?**
- Run: `npm run test:create-data`
- Check test user exists: `npm run test:setup-user`

**API not working?**
- Check DATABASE_URL in `.env` file
- Verify database connection: `npm run db:studio`
- Check API logs in terminal

