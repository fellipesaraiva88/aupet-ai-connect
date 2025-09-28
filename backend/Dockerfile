# Multi-stage build for production optimization
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development dependencies for build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install security updates and monitoring tools
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init curl jq tini && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S auzap -u 1001 -G nodejs

WORKDIR /app

# Copy production dependencies
COPY --from=dependencies --chown=auzap:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=auzap:nodejs /app/dist ./dist
COPY --from=builder --chown=auzap:nodejs /app/package*.json ./

# Create logs directory
RUN mkdir -p /app/logs && chown -R auzap:nodejs /app/logs

# Set environment
ENV NODE_ENV=production
ENV PORT=3001
ENV LOG_LEVEL=info
ENV GRACEFUL_TIMEOUT=30000

# Enhanced health check with dependency validation
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Security: Use non-root user
USER auzap

# Expose port
EXPOSE 3001

# Use tini for proper signal handling and zombie reaping
ENTRYPOINT ["/sbin/tini", "--"]

# Graceful shutdown with monitoring
CMD ["node", "--max-old-space-size=512", "dist/server.js"]