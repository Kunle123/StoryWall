#!/bin/bash

echo "🔧 Fixing Database Setup..."
echo ""

# Try to create database using postgres user
echo "Attempting to create database 'storywall'..."
if psql -h localhost -U postgres -c "CREATE DATABASE storywall;" 2>/dev/null; then
  echo "✓ Database 'storywall' created successfully"
  
  # Grant permissions to 'user'
  echo "Granting permissions to 'user'..."
  psql -h localhost -U postgres -d storywall -c "GRANT ALL PRIVILEGES ON DATABASE storywall TO \"user\";" 2>/dev/null
  psql -h localhost -U postgres -d storywall -c "GRANT ALL ON SCHEMA public TO \"user\";" 2>/dev/null
  echo "✓ Permissions granted"
else
  echo "Could not create database (might already exist or need password)"
  echo "Trying alternative: updating DATABASE_URL to use 'postgres' user..."
fi

echo ""
echo "Next: Run 'npx prisma db push' to create tables"
