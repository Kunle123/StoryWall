# Database Setup Guide

This project uses PostgreSQL via Railway and Prisma ORM for database management.

## Prerequisites

1. **Railway Account**: You should already have Railway set up with a PostgreSQL database
2. **DATABASE_URL**: Railway automatically provides this environment variable when you add a PostgreSQL service

## Setup Steps

### 1. Get DATABASE_URL from Railway

1. Go to your Railway dashboard
2. Click on your PostgreSQL service
3. Go to the "Variables" tab
4. Copy the `DATABASE_URL` value

### 2. Set up Environment Variables

Create a `.env.local` file in the root directory:

```env
DATABASE_URL="your_railway_postgresql_connection_string"
```

**Note**: Railway automatically injects `DATABASE_URL` in production, so you only need this for local development.

### 3. Generate Prisma Client

```bash
npm run db:generate
```

This generates the Prisma Client based on the schema in `prisma/schema.prisma`.

### 4. Push Schema to Database (Development)

For development, you can push the schema directly:

```bash
npm run db:push
```

This will:
- Create all tables, indexes, and relationships
- **Not** create migration files (use `db:migrate` for that)

### 5. Create Migration (Production)

For production, create a migration:

```bash
npm run db:migrate
```

This will:
- Create a migration file in `prisma/migrations/`
- Apply the migration to your database

### 6. Verify Setup

Open Prisma Studio to view your database:

```bash
npm run db:studio
```

This opens a visual database browser at `http://localhost:5555`

## Database Schema

The database includes the following tables:

- **users** - User accounts (linked to Clerk)
- **timelines** - Timeline collections
- **events** - Individual timeline events
- **categories** - Event categories
- **collaborators** - Timeline collaboration permissions

See `prisma/schema.prisma` for the complete schema definition.

## Railway Production Setup

Railway automatically:
1. Provides `DATABASE_URL` environment variable
2. Runs `prisma generate` during build (included in `npm run build`)
3. Connects your app to the database

**Important**: Make sure to run migrations before deploying:

```bash
# On Railway or locally with Railway DATABASE_URL:
npx prisma migrate deploy
```

## Troubleshooting

### "Prisma Client not generated"
Run: `npm run db:generate`

### "DATABASE_URL not found"
- Check your `.env.local` file exists
- Verify Railway has the PostgreSQL service connected
- In Railway, check Variables tab for `DATABASE_URL`

### "Relation does not exist"
- Run `npm run db:push` or `npm run db:migrate`
- Make sure your schema matches your database

## Next Steps

After database setup:
1. ✅ Database schema is ready
2. ⏳ Create API routes to interact with database
3. ⏳ Replace mock data with database queries
4. ⏳ Add authentication (Clerk) integration

## Current Status

- ✅ Prisma schema created
- ✅ Database client setup (`lib/db/prisma.ts`)
- ⏳ Database connection pending (need DATABASE_URL)
- ⏳ Migrations pending

The app currently works with mock data. Once you have DATABASE_URL set up, you can migrate to database-backed data.

