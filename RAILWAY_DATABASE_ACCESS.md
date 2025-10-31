# Accessing Database on Railway Platform

Yes! You can view your test data directly on Railway. Here are several ways:

## 🔍 Method 1: Railway Dashboard (Easiest)

### View Database in Railway UI

1. **Go to Railway Dashboard**
   - Visit: https://railway.app/dashboard
   - Log in to your account

2. **Navigate to Your Project**
   - Click on your StoryWall project
   - Find your **PostgreSQL** service

3. **View Database Data**
   - Click on the PostgreSQL service
   - Go to the **"Data"** tab
   - You'll see a database browser where you can:
     - View all tables
     - Browse data in each table
     - See relationships
     - Run SQL queries

### Railway's Built-in Database Browser

Railway provides a web-based database browser:
- Navigate to: Your Project → PostgreSQL Service → Data Tab
- You can query tables like:
  ```sql
  SELECT * FROM users;
  SELECT * FROM timelines;
  SELECT * FROM events;
  ```

## 🔌 Method 2: Railway CLI (Command Line)

### Connect via Railway CLI

1. **Install Railway CLI** (if not already installed):
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Connect to Database**:
   ```bash
   # Link to your project
   railway link
   
   # Connect to PostgreSQL shell
   railway connect postgres
   ```

4. **Run SQL Queries**:
   ```sql
   SELECT * FROM users;
   SELECT * FROM timelines ORDER BY created_at DESC;
   SELECT * FROM events WHERE timeline_id = 'bd4cd197-77cd-4e51-a6de-d026d0982fc2';
   ```

## 🌐 Method 3: Railway PostgreSQL Query Tab

Railway's PostgreSQL service has a built-in SQL query editor:

1. Go to: **Project → PostgreSQL Service**
2. Click on **"Query"** tab (or **"SQL"** tab)
3. Run queries directly:
   ```sql
   -- View all users
   SELECT id, username, email, created_at FROM users;
   
   -- View all timelines with creator info
   SELECT 
     t.id, 
     t.title, 
     t.slug, 
     u.username as creator,
     t.view_count,
     t.created_at
   FROM timelines t
   JOIN users u ON t.creator_id = u.id
   ORDER BY t.created_at DESC;
   
   -- View all events for a timeline
   SELECT 
     e.id,
     e.title,
     e.date,
     e.category,
     t.title as timeline_title
   FROM events e
   JOIN timelines t ON e.timeline_id = t.id
   WHERE t.id = 'bd4cd197-77cd-4e51-a6de-d026d0982fc2'
   ORDER BY e.date ASC;
   
   -- Count events per timeline
   SELECT 
     t.title,
     COUNT(e.id) as event_count
   FROM timelines t
   LEFT JOIN events e ON t.id = e.timeline_id
   GROUP BY t.id, t.title;
   ```

## 📊 Method 4: External Database Tools

### Connect Using Database Client

Railway provides connection details you can use with external tools:

1. **Get Connection String**:
   - Railway Dashboard → PostgreSQL Service → Variables
   - Copy `DATABASE_URL`

2. **Use with Database Clients**:
   - **pgAdmin** (PostgreSQL GUI)
   - **DBeaver** (Universal Database Tool)
   - **TablePlus** (Modern Database GUI)
   - **Postico** (macOS)

3. **Connection Details**:
   - Use the `DATABASE_URL` from Railway
   - Format: `postgresql://user:password@host:port/database`

## 🔐 Method 5: Railway Environment Variables

View your database connection details:

1. Go to: **Project → PostgreSQL Service → Variables**
2. You'll see:
   - `DATABASE_URL` - Full connection string
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Individual components

## 💡 Quick SQL Queries to Try

### View Test User
```sql
SELECT * FROM users WHERE username = 'testuser';
```

### View All Timelines
```sql
SELECT 
  id,
  title,
  slug,
  view_count,
  is_public,
  created_at
FROM timelines
ORDER BY created_at DESC;
```

### View Timeline with Events Count
```sql
SELECT 
  t.id,
  t.title,
  t.description,
  COUNT(e.id) as event_count,
  t.created_at
FROM timelines t
LEFT JOIN events e ON t.id = e.timeline_id
GROUP BY t.id
ORDER BY t.created_at DESC;
```

### View All Events
```sql
SELECT 
  e.id,
  e.title,
  e.date,
  e.category,
  t.title as timeline_title
FROM events e
JOIN timelines t ON e.timeline_id = t.id
ORDER BY e.date ASC;
```

### View Your Test Timeline
```sql
SELECT 
  t.*,
  u.username as creator_name
FROM timelines t
JOIN users u ON t.creator_id = u.id
WHERE t.id = 'bd4cd197-77cd-4e51-a6de-d026d0982fc2';
```

## 🎯 Recommended Approach

**For Quick Viewing**: Use Railway Dashboard → PostgreSQL Service → Data Tab

**For Complex Queries**: Use Railway Query Tab or Railway CLI

**For Development**: Use Prisma Studio locally (`npm run db:studio`)

## 📝 Notes

- Railway's database browser is read-only in some views
- For write operations, use Prisma or direct SQL in Query tab
- Connection details are automatically available in your Railway project
- Your production database is separate from local development

## 🔗 Useful Links

- Railway Dashboard: https://railway.app/dashboard
- Railway Docs: https://docs.railway.app
- PostgreSQL Docs: https://www.postgresql.org/docs/

