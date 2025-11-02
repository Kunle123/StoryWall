# Fixing Database Permission Errors

If you see errors like:
```
User `user` was denied access on the database `storywall.public`
```

## Quick Fix Options

### Option 1: Use Railway Database (Recommended for Testing)

1. **Get Railway DATABASE_URL:**
   - Go to Railway Dashboard → Your Project → PostgreSQL Service
   - Click "Variables" tab
   - Copy the `DATABASE_URL` value

2. **Update your `.env.local`:**
   ```env
   DATABASE_URL="postgresql://postgres:PASSWORD@HOST:PORT/railway?schema=public"
   ```
   Replace with your actual Railway connection string.

3. **Push schema to Railway:**
   ```bash
   npx prisma db push
   ```

### Option 2: Use Local PostgreSQL Database

1. **Install PostgreSQL locally** (if not installed):
   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14
   ```

2. **Create database and user:**
   ```bash
   createdb storywall
   # Or via psql:
   psql postgres
   CREATE DATABASE storywall;
   \q
   ```

3. **Update `.env.local`:**
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/storywall?schema=public"
   ```
   Replace `password` with your PostgreSQL password (if set).

4. **Push schema:**
   ```bash
   npx prisma db push
   ```

### Option 3: Use Docker (Easiest for Local)

1. **Run PostgreSQL in Docker:**
   ```bash
   docker run --name storywall-db \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=storywall \
     -p 5432:5432 \
     -d postgres:14
   ```

2. **Update `.env.local`:**
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/storywall?schema=public"
   ```

3. **Push schema:**
   ```bash
   npx prisma db push
   ```

## Verify Connection

After updating DATABASE_URL:

1. **Test connection:**
   ```bash
   npx prisma db pull
   ```

2. **View database:**
   ```bash
   npx prisma studio
   ```
   Opens at http://localhost:5555

## Still Having Issues?

Check:
- ✅ DATABASE_URL format is correct
- ✅ Database exists
- ✅ User has permissions (for local, use `postgres` user or grant permissions)
- ✅ Database server is running
- ✅ Port is correct (default: 5432)
- ✅ No firewall blocking connection

For Railway:
- ✅ Copy the FULL connection string (includes password)
- ✅ Database service is running
- ✅ Schema matches (`?schema=public`)

