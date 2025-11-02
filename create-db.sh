#!/bin/bash

echo "🔧 Creating database and fixing permissions..."

# Try to create database
psql -h localhost -U postgres -c "CREATE DATABASE storywall;" 2>&1 | grep -v "already exists" || echo "Database might already exist"

# Grant permissions
psql -h localhost -U postgres -d storywall -c "GRANT ALL PRIVILEGES ON DATABASE storywall TO postgres;" 2>&1
psql -h localhost -U postgres -d storywall -c "GRANT ALL ON SCHEMA public TO postgres;" 2>&1

echo "✅ Done"
