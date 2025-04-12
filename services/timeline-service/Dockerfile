# Use multi-stage build for smaller final image
FROM node:18-alpine AS deps

# Set working directory with explicit path
WORKDIR /usr/src/app

# Copy package files
COPY ./package.json ./package-lock.json* ./

# Split dependency installation into smaller chunks
RUN npm install --no-optional && npm cache clean --force

# Second stage for the application code
FROM node:18-alpine AS runner

WORKDIR /usr/src/app

# Copy node modules and source code
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY ./src ./src

# Run basic verification command
RUN node -e "console.log('Node.js runtime is working')"

# Set environment variables
ENV NODE_ENV production
ENV PORT 3001

# Expose the service port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node ./src/healthcheck.js

# Run the application
CMD ["node", "src/index.js"] 