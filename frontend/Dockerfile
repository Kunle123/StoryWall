# Build stage
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --quiet

# Copy source files
COPY public ./public
COPY src ./src
COPY tsconfig.json ./

# Build the app
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copy build files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx configuration if needed
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 