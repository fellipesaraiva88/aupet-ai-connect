# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Auzap.ai - a WhatsApp Business Intelligence platform for pet care services. It's a full-stack TypeScript application with separate frontend and backend services, designed for deployment on Render with Supabase as the database.

## Architecture

**Monorepo Structure:**
- `frontend/` - React SPA with Vite, TypeScript, and Tailwind CSS
- `backend/` - Express.js API server with TypeScript
- Root level contains shared configuration and deployment files

**Key Technologies:**
- Frontend: React 18, Vite, TypeScript, shadcn/ui, TanStack Query, Socket.io-client
- Backend: Express.js, TypeScript, Socket.io, Supabase, JWT auth, OpenAI integration
- Database: Supabase (PostgreSQL) with real-time subscriptions
- Deployment: Render (configured via render.yaml)
- Testing: Playwright for E2E testing

## Common Development Commands

**Root Level (uses npm workspaces):**
```bash
# Development (runs both frontend and backend)
npm run dev

# Build backend only (production)
npm run build

# Start production backend
npm start

# Testing
npm run test              # E2E tests with Playwright
npm run test:api         # API tests only
npm run test:auth        # Auth flow tests
npm run test:security    # Security tests
npm run test:backend     # Backend unit tests
npm run test:frontend    # Frontend tests

# Linting
npm run lint             # Backend linting only

# Install Playwright browsers
npm run test:install
```

**Backend Specific:**
```bash
cd backend
npm run dev              # Development server with tsx
npm run build            # TypeScript compilation
npm run start            # Production server
npm run start:dev        # Development with watch mode
npm run clean            # Remove dist folder
npm run debug            # Environment debugging
npm run migrate:whatsapp # WhatsApp instances migration
```

**Frontend Specific:**
```bash
cd frontend
npm run dev              # Vite dev server
npm run build            # Production build
npm run lint             # ESLint
npm run preview          # Preview production build
npm run test             # Vitest unit tests
npm run test:ui          # Vitest UI mode
```

## Key Backend Services

**Core Services** (`backend/src/services/`):
- `supabase.ts` - Database operations and real-time subscriptions
- `websocket.ts` - Socket.io server for real-time updates
- `monitoring.ts` - System health and metrics
- `whatsapp/` - WhatsApp Evolution API integration
- `ai/` - OpenAI GPT-4 integration for chat assistance

**API Routes** (`backend/src/routes/`):
- `whatsapp.ts` - WhatsApp instance management
- `conversations.ts` - Chat conversations and messaging
- `customers.ts` - Customer management
- `pets.ts` - Pet records and health management
- `appointments.ts` - Appointment scheduling
- `ai.ts` - AI chat and automation
- `catalog.ts` - Product/service catalog
- `dashboard.ts` - Analytics and metrics
- `webhook.ts` - WhatsApp webhook handling

**Middleware** (`backend/src/middleware/`):
- `auth.ts` - JWT authentication with Supabase
- `rate-limiter.ts` - API rate limiting
- `security-headers.ts` - Security headers and CORS
- `tenant-isolation.ts` - Multi-tenant data isolation
- `audit-logger.ts` - Request/response logging

## Frontend Architecture

**Pages** (`frontend/src/pages/`):
- `Dashboard.tsx` - Main analytics dashboard
- `WhatsApp.tsx` - WhatsApp instance management
- `Conversations.tsx` - Real-time chat interface
- `Customers.tsx` - Customer management
- `ClientsPets.tsx` - Pet records
- `Appointments.tsx` - Appointment scheduling
- `Catalog.tsx` - Product/service catalog
- `Analytics.tsx` - Detailed analytics
- `AIConfig.tsx` - AI configuration

**Key Hooks** (`frontend/src/hooks/`):
- `useSupabase.ts` - Supabase client and auth
- `useSocket.ts` - Socket.io real-time connection
- `useWhatsApp.ts` - WhatsApp integration
- `useConversations.ts` - Chat state management

## Environment Variables

**Backend (.env):**
```
NODE_ENV=development|production
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key
FRONTEND_URL=frontend_url
WEBHOOK_URL=backend_webhook_url
```

**Frontend (.env):**
```
VITE_API_URL=backend_api_url
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Deployment

The project is configured for Render deployment via `render.yaml`:
- Backend: Web service on Node.js runtime
- Frontend: Static site built with Vite
- Redis: Cache service for rate limiting

**Build Process:**
1. Backend builds TypeScript to `dist/`
2. Frontend builds to `dist/` with Vite
3. Environment variables injected at build time
4. Health checks configured at `/health`

## Database Schema

Uses Supabase with the following key tables:
- `profiles` - User profiles and organization data
- `whatsapp_instances` - WhatsApp connection instances
- `conversations` - Chat conversations
- `messages` - Individual chat messages
- `customers` - Customer records
- `pets` - Pet information and health records
- `appointments` - Appointment scheduling
- `products` - Catalog items

## Security Features

- JWT authentication with Supabase Auth
- Rate limiting (auth: 5/min, API: 100/min, webhooks: 1000/min)
- Input validation with Zod schemas
- Security headers (helmet, CORS, XSS protection)
- Tenant isolation for multi-organization support
- Audit logging for all API requests

## Real-time Features

- Socket.io for bidirectional communication
- Supabase real-time subscriptions for database changes
- Live chat interface with message status updates
- Real-time dashboard metrics and notifications

## Testing Strategy

- E2E testing with Playwright
- API endpoint testing
- Security and authentication testing
- Responsive UI testing
- Performance monitoring tests

## Development Notes

- Always use TypeScript with strict mode enabled
- Follow the existing component structure in frontend
- Use Supabase client for all database operations
- Implement proper error handling with try-catch blocks
- Log important operations using the configured logger
- Validate all inputs using Zod schemas
- Maintain security best practices (no hardcoded secrets)
- Use Socket.io for real-time features
- Follow the established API route patterns

## Deployment URLs

- Frontend: https://auzap-frontend.onrender.com
- Backend API: https://auzap-backend-api.onrender.com
- Health check: https://auzap-backend-api.onrender.com/health

## Important Instructions

- Always analyze and test on deployed versions, not locally
- Use Render MCP for deployment analysis (frontend and backend services)
- Never use Puppeteer - always use Playwright MCP
- Never use mocked data - always use real data
- Investigate errors thoroughly instead of simplifying solutions
- Never change the original project scope
- Search the internet for updated information to minimize errors
- Never change the design
- Always work on 4 tasks simultaneously