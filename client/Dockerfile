# Multi-stage build for PixelSqueeze Frontend
FROM node:18-alpine AS base

# Install dependencies for native modules and Redis
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat \
    redis \
    curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including Redis client
RUN npm ci && \
    npm install redis

# Development stage
FROM base AS development

# Copy source code
COPY . .

# Create Redis configuration
RUN echo "daemonize yes" >> /etc/redis.conf && \
    echo "bind 0.0.0.0" >> /etc/redis.conf && \
    echo "port 6379" >> /etc/redis.conf && \
    echo "maxmemory 256mb" >> /etc/redis.conf && \
    echo "maxmemory-policy allkeys-lru" >> /etc/redis.conf

# Expose ports
EXPOSE 3000 6379

# Start Redis and development server
CMD ["sh", "-c", "redis-server /etc/redis.conf & npm run dev"]

# Production stage
FROM base AS production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create Redis configuration
RUN echo "daemonize yes" >> /etc/redis.conf && \
    echo "bind 0.0.0.0" >> /etc/redis.conf && \
    echo "port 6379" >> /etc/redis.conf && \
    echo "maxmemory 256mb" >> /etc/redis.conf && \
    echo "maxmemory-policy allkeys-lru" >> /etc/redis.conf

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose ports
EXPOSE 3000 6379

# Health check for both app and Redis
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 && redis-cli ping || exit 1

# Start Redis and production server
CMD ["sh", "-c", "redis-server /etc/redis.conf & npm start"] 