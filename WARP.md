# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Auzap AI Connect is a comprehensive WhatsApp AI platform for pet care management. The system transforms pet care operations by integrating WhatsApp Business automation with AI-powered responses, patient management, and multi-doctor clinic workflows. The platform includes a kanban-style pipeline for managing clients through different phases in the clinic and supports multiple doctors since clinics typically have more than one doctor.

## Architecture Overview

This is a full-stack TypeScript application with three main tiers:

### 1. Frontend (React + Vite)
- **Location**: `./frontend/`
- **Framework**: React 18 with TypeScript, Vite for build tooling
- **UI**: Tailwind CSS + Radix UI (shadcn/ui components)
- **State Management**: TanStack React Query for server state, React Context for auth
- **Real-time**: WebSocket connections via Socket.io client

### 2. Backend (Node.js + Express)
- **Location**: `./backend/`
- **Runtime**: Node.js 18+ with Express.js and TypeScript
- **Architecture**: Service-oriented with middleware layers
- **Real-time**: Socket.io for WebSocket connections
- **Security**: JWT authentication, rate limiting, CORS, Helmet

### 3. Database & External Services
- **Primary DB**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **WhatsApp**: Evolution API integration for message handling
- **AI**: OpenAI GPT-4 integration for intelligent responses
- **Caching**: Redis for session management and caching

## Core Data Flow

The system processes WhatsApp messages through this flow:
1. WhatsApp → Evolution API → Webhook → Backend API
2. Backend processes message with AI if needed
3. Response flows back through same chain
4. Real-time updates broadcast via WebSocket to frontend
5. All data persisted to Supabase with proper tenant isolation

## Development Commands

### Initial Setup
```bash
# Install all dependencies (root, frontend, backend)
npm install

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Development Servers
```bash
# Start both frontend and backend concurrently
npm run dev

# Start individual services
npm run dev:frontend    # Frontend on port 8080 (Vite dev server)
npm run dev:backend     # Backend on port 3001 (with hot reload)
```

### Building & Production
```bash
# Build backend only (frontend builds via Lovable)
npm run build
npm run start

# Clean build artifacts
npm run clean
```

### Testing Commands
```bash
# Run complete E2E test suite (Playwright)
npm test

# Specific test suites
npm run test:auth       # Authentication flow tests
npm run test:api        # API integration tests  
npm run test:security   # Security & authorization tests
npm run test:ui         # Form validation tests
npm run test:responsive # Multi-device responsive tests

# Test utilities
npm run test:install    # Install Playwright browsers
npm run test:report     # View HTML test report
```

### Docker Development
```bash
# Full stack with Docker Compose
docker-compose up -d

# Individual services
docker-compose up frontend backend redis nginx
```

## Key Architecture Patterns

### Multi-Tenant Security
The system uses organization-based tenant isolation:
- All database queries filtered by `organization_id`
- JWT tokens contain organization context
- Supabase RLS policies enforce data isolation
- API middleware validates tenant access

### WhatsApp Message Processing
Messages follow a structured pipeline:
```typescript
// Webhook receives message from Evolution API
POST /api/webhook/whatsapp
├── Validate webhook signature
├── Extract message data and sender info
├── Check if AI response needed (business hours, keywords)
├── Generate AI response if applicable
├── Send response via Evolution API
└── Store conversation in Supabase
```

### Real-time Updates
WebSocket events are used for:
- New message notifications
- Appointment status changes
- Dashboard metric updates
- Multi-doctor coordination in kanban pipeline

### Service Layer Organization
Backend services are organized by domain:
- `routes/`: Express route handlers
- `services/`: Business logic (AI, Evolution API, etc.)
- `middleware/`: Cross-cutting concerns (auth, logging, validation)
- `monitoring/`: System health, metrics, alerting

## Environment Configuration

### Required Environment Variables

**Backend** (`.env`):
```env
# Core
NODE_ENV=development
PORT=3001

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# WhatsApp Integration  
EVOLUTION_API_URL=your_evolution_api_url
EVOLUTION_API_KEY=your_evolution_key

# AI Integration
OPENAI_API_KEY=your_openai_key

# Security
JWT_SECRET=your_jwt_secret
API_KEY=your_api_key
```

**Frontend** (`.env`):
```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Database Schema Patterns

### Core Tables Structure
The Supabase schema centers around these core entities:
- **Organizations**: Multi-tenant isolation
- **Users**: Authentication and roles (supporting multiple doctors)
- **Customers**: Pet owners with contact information
- **Pets**: Patient records with health data
- **Appointments**: Scheduling with kanban-style status tracking
- **Conversations**: WhatsApp message history
- **AI_Responses**: AI interaction logging

### Kanban Pipeline States
Patients/appointments flow through these phases:
1. **Inquiry**: Initial contact via WhatsApp
2. **Scheduled**: Appointment booked
3. **In Progress**: Currently being treated
4. **Completed**: Treatment finished
5. **Follow-up**: Post-treatment monitoring

Each state supports multiple doctors working concurrently.

## API Endpoint Patterns

### RESTful Conventions
```typescript
// Resource-based routes with consistent patterns
GET    /api/pets              // List pets with filtering
POST   /api/pets              // Create new pet
GET    /api/pets/:id          // Get specific pet
PUT    /api/pets/:id          // Update pet
DELETE /api/pets/:id          // Soft delete pet

// Nested resources for relationships
GET    /api/pets/:id/appointments
POST   /api/pets/:id/health-records
```

### Authentication Middleware
All API routes (except webhooks) require JWT authentication:
```typescript
// Routes automatically include organization context
// from JWT token, ensuring tenant isolation
```

## Testing Strategy

### E2E Testing with Playwright
The project uses comprehensive E2E testing covering:
- **Authentication flows**: Signup → Login → Dashboard validation
- **API integration**: Full CRUD operations across all endpoints
- **Security testing**: Authorization, XSS protection, input validation
- **Form validation**: Real-time validation and user interactions
- **Responsive design**: Multi-device testing (mobile, tablet, desktop)

### Test Organization
```
tests/
├── e2e/           # End-to-end user journey tests
├── api/           # API integration and data consistency
├── security/      # Authorization and security validation  
├── ui/            # Form validation and interaction tests
├── responsive/    # Multi-device compatibility tests
└── utils/         # Test helpers and page objects
```

### Running Specific Test Categories
```bash
# Critical path testing
npm run test:auth      # User authentication flows
npm run test:api       # Backend API functionality
npm run test:security  # Security and data protection

# Cross-browser testing (Chromium, Firefox, WebKit)
npx playwright test --project=chromium
npx playwright test --headed  # Visual debugging mode
```

## Troubleshooting Common Issues

### WhatsApp Integration Issues
- Verify Evolution API endpoint is accessible
- Check API key in environment variables
- Ensure webhook URL is publicly accessible for Evolution API callbacks
- Monitor backend logs for webhook processing errors

### Database Connection Issues
- Verify Supabase URL and keys are correct
- Check if RLS policies are properly configured
- Ensure organization_id context is being passed correctly

### AI Response Problems
- Verify OpenAI API key and rate limits
- Check prompt templates in AI service
- Monitor token usage and response times
- Review AI conversation logs in database

### Real-time Features Not Working
- Confirm WebSocket connections are established
- Check Socket.io client/server version compatibility
- Verify CORS settings allow WebSocket upgrades
- Monitor network tab for WebSocket connection errors

### Build/Deploy Issues
- Ensure Node.js 18+ is installed
- Check all environment variables are set
- Verify TypeScript compilation succeeds
- For Render deployment, ensure build commands include `cd backend`

## Multi-Doctor Clinic Considerations

When working with features that support multiple doctors:
- Always consider doctor assignments in appointment scheduling
- Implement proper access controls for patient data
- Use the kanban pipeline to coordinate between doctors
- Ensure real-time updates reach all relevant doctors
- Handle conflicts when multiple doctors work on same cases

## Deployment Options

The platform supports multiple deployment strategies to accommodate different needs and budgets:

### DigitalOcean Deployment

DigitalOcean provides cost-effective, scalable infrastructure with multiple deployment options:

#### Option 1: DigitalOcean App Platform (Recommended for Most Users)

**Benefits:**
- Managed infrastructure with auto-scaling
- Built-in CI/CD integration
- Managed databases and Redis
- Automatic SSL certificates
- Zero-downtime deployments
- Cost-effective for small to medium workloads

**Configuration Files:**
```bash
# DigitalOcean App Platform specifications
digitalocean/
├── app.yaml              # Base App Platform configuration
├── app.staging.yaml      # Staging environment
├── app.production.yaml   # Production environment
└── migration/            # Database migration scripts
```

**Deployment Commands:**
```bash
# Initial deployment
npm run do:deploy:app

# Deploy to staging
npm run do:deploy:staging

# Deploy to production (requires approval)
npm run do:deploy:production

# View application logs
npm run do:logs
```

**Resource Requirements:**
- **Backend**: 2 vCPU, 4GB RAM (scales 1-5 instances)
- **Frontend**: Static site hosting with global CDN
- **Database**: Managed PostgreSQL (2 vCPU, 4GB RAM)
- **Cache**: Managed Redis (1GB memory)
- **Estimated Cost**: $50-200/month depending on usage

#### Option 2: DigitalOcean Droplets with Docker (For Advanced Users)

**Benefits:**
- Full control over infrastructure
- Custom configurations possible
- Lower costs for predictable workloads
- Better for compliance requirements

**Configuration Files:**
```bash
digitalocean/
├── docker-compose.do.yml    # DO-optimized Docker Compose
├── nginx/
│   ├── default.conf         # Nginx reverse proxy config
│   └── ssl.conf             # SSL/TLS configuration
├── scripts/
│   ├── setup-droplet.sh     # Initial server setup
│   ├── deploy.sh            # Deployment automation
│   ├── backup.sh            # Database backup script
│   └── ssl-renew.sh         # Certificate renewal
└── monitoring/
    ├── prometheus.yml       # Metrics collection
    └── grafana-dashboard.json
```

**Droplet Sizing:**
- **Development**: 2GB RAM, 1 vCPU ($12/month)
- **Staging**: 4GB RAM, 2 vCPU ($24/month)
- **Production**: 8GB RAM, 4 vCPU ($48/month)
- **Load Balancer**: $12/month (for production)

**Setup Process:**
```bash
# 1. Create and configure droplet
bash digitalocean/scripts/setup-droplet.sh

# 2. Deploy application
npm run do:droplet:deploy

# 3. Set up SSL certificates
npm run do:ssl:setup

# 4. Configure monitoring
npm run do:monitoring:setup
```

#### DigitalOcean Managed Services Integration

**Managed PostgreSQL:**
- Connection pooling with PgBouncer (25 connections/instance)
- Automated backups with 7-day retention
- Read replicas for scaling
- Performance insights and slow query monitoring
- SSL-required connections

**Managed Redis:**
- Memory optimization for session storage
- Persistence configured for critical cache data
- Eviction policies: `allkeys-lru` for general cache
- Connection pooling for high availability

**DigitalOcean Spaces (Object Storage):**
- S3-compatible API for file uploads
- CDN distribution for static assets
- CORS configuration for frontend access
- Lifecycle policies for temporary files
- Integrated backup storage

#### Environment Configuration for DigitalOcean

**Required Environment Variables:**
```bash
# DigitalOcean Database (replaces Supabase)
POSTGRES_URL=postgresql://user:pass@db-cluster.db.ondigitalocean.com:25060/database?sslmode=require
REDIS_URL=rediss://user:pass@redis-cluster.db.ondigitalocean.com:25061

# DigitalOcean Spaces (for file storage)
SPACES_KEY=your_spaces_access_key
SPACES_SECRET=your_spaces_secret_key
SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
SPACES_BUCKET=auzap-uploads

# Monitoring and Logging
DATADOG_API_KEY=your_datadog_key
LOGTAIL_SOURCE_TOKEN=your_logtail_token

# Application specific
NODE_ENV=production
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key
EVOLUTION_API_URL=your_evolution_api_url
EVOLUTION_API_KEY=your_evolution_key
```

#### DigitalOcean Development Commands

```bash
# Database operations
npm run do:db:migrate      # Run database migrations
npm run do:db:backup       # Create database backup
npm run do:db:restore      # Restore from backup

# Monitoring and logs
npm run do:logs            # View application logs
npm run do:metrics         # View performance metrics
npm run do:health          # Check service health

# Deployment operations
npm run do:deploy:staging  # Deploy to staging
npm run do:deploy:prod     # Deploy to production
npm run do:rollback        # Rollback deployment

# Infrastructure management
npm run do:spaces:sync     # Sync files to Spaces
npm run do:ssl:renew       # Renew SSL certificates
npm run do:scale:up        # Scale resources up
npm run do:scale:down      # Scale resources down
```

#### Cost Optimization Strategies

**Resource Optimization:**
- Use reserved instances for predictable workloads (20% savings)
- Implement auto-scaling to handle traffic spikes
- Schedule non-critical services during off-peak hours
- Use CDN caching to reduce bandwidth costs

**Monitoring and Alerts:**
- Set up billing alerts at $50, $100, $200 thresholds
- Monitor resource utilization weekly
- Identify and eliminate unused resources monthly
- Use cost allocation tags for feature-level tracking

#### Migration from Supabase to DigitalOcean

**Migration Process:**
1. **Set up DigitalOcean Managed PostgreSQL**
2. **Export Supabase data** using pg_dump
3. **Migrate authentication** from Supabase Auth to custom JWT
4. **Update Row Level Security** policies to standard PostgreSQL
5. **Test data integrity** with validation scripts
6. **Switch DNS** with zero-downtime deployment

**Migration Commands:**
```bash
# 1. Export from Supabase
npm run migration:export

# 2. Set up DigitalOcean database
npm run migration:setup-do-db

# 3. Import data
npm run migration:import

# 4. Validate migration
npm run migration:validate

# 5. Switch application
npm run migration:cutover
```

### Render Backend Deployment (Current)

- Backend configured for automatic Render deployment
- Uses `render.yaml` for service configuration
- Environment variables configured in Render dashboard
- Health checks available at `/health` endpoint

### Lovable Frontend Integration

- Frontend is primarily managed through Lovable platform
- Changes via Lovable auto-commit to repository
- Local development still possible via standard Vite commands
- Deployment handled through Lovable's publish feature

## Monitoring and Observability

### DigitalOcean Monitoring Setup

**System Metrics:**
- CPU utilization (alert > 80% for 5 minutes)
- Memory usage (alert > 85% for 3 minutes)
- Disk space (alert > 90% usage)
- Network I/O and bandwidth monitoring

**Application Metrics:**
- WhatsApp webhook response times
- AI response generation latency
- Database query performance
- WebSocket connection counts
- Multi-doctor pipeline throughput

**Logging Configuration:**
```bash
# Structured logging with correlation IDs
LOG_LEVEL=info
LOG_FORMAT=json
LOG_CORRELATION=true

# Log retention policies
STANDARD_RETENTION=30d
AUDIT_RETENTION=90d
ERROR_RETENTION=180d
```

**Alert Policies:**
- **Critical**: Database down, API 5xx errors > 1%
- **Warning**: High response times, memory usage > 80%
- **Info**: Deployments, scaling events

## Troubleshooting DigitalOcean Issues

### Common Issues and Solutions

**Connection Pool Exhaustion:**
```bash
# Increase connection pool size
DATABASE_MAX_CONNECTIONS=25
DATABASE_POOL_SIZE=20

# Monitor pool usage
npm run do:db:pool-status
```

**SSL Certificate Issues:**
```bash
# Check certificate status
sudo certbot certificates

# Force renewal
npm run do:ssl:renew --force

# Test configuration
nginx -t && systemctl reload nginx
```

**Load Balancer 502/504 Errors:**
- Check backend health endpoints
- Verify security group rules
- Monitor backend response times
- Check load balancer logs

**Docker Container Issues:**
```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs -f backend

# Restart specific service
docker-compose restart backend
```

### Emergency Procedures

**Rollback Failed Deployment:**
```bash
# Quick rollback to previous version
npm run do:rollback

# Manual rollback with specific version
doctl apps update $APP_ID --spec=digitalocean/app.production.yaml
```

**Database Recovery:**
```bash
# Restore from automated backup
npm run do:db:restore --backup-date=2024-01-15

# Point-in-time recovery
npm run do:db:pitr --timestamp="2024-01-15 14:30:00"
```

This comprehensive deployment strategy supports your robust, scalable pet care management platform with sophisticated WhatsApp automation and multi-doctor workflows across multiple infrastructure providers.
