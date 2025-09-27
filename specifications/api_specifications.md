# API Specifications

This document defines all backend API endpoints required to resurrect the 107 dead functionalities identified in the audit. Every endpoint supports proper authentication, organization isolation, and real-time updates.

## Base Configuration

**Base URL**: `/api/v1`
**Authentication**: Bearer token (Supabase JWT)
**Content-Type**: `application/json`
**Organization Context**: Extracted from authenticated user's organization_id

## Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Success Response Format

```json
{
  "success": true,
  "data": {},
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 1. Authentication Endpoints

### POST /auth/login
**Purpose**: User authentication with email/password

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "admin",
      "organization_id": "uuid",
      "organization": {
        "id": "uuid",
        "name": "Pet Clinic ABC",
        "subscription_tier": "premium"
      }
    },
    "token": "jwt_token_here",
    "expires_at": "2024-01-01T00:00:00Z"
  }
}
```

### POST /auth/logout
**Purpose**: Invalidate current session

### POST /auth/refresh
**Purpose**: Refresh JWT token

### GET /auth/me
**Purpose**: Get current user information

## 2. Dashboard Endpoints

### GET /dashboard/stats
**Purpose**: Main dashboard statistics

**Response**:
```json
{
  "success": true,
  "data": {
    "customers": {
      "total": 245,
      "new_this_month": 12,
      "growth_percentage": 8.5
    },
    "pets": {
      "total": 387,
      "new_this_month": 18
    },
    "appointments": {
      "today": 8,
      "this_week": 45,
      "completion_rate": 92.5
    },
    "conversations": {
      "active": 23,
      "pending_human": 3,
      "ai_resolution_rate": 78.2
    },
    "revenue": {
      "this_month": 15750.00,
      "last_month": 14200.00,
      "growth_percentage": 10.9
    }
  }
}
```

### GET /dashboard/recent-activity
**Purpose**: Recent system activity feed

### GET /dashboard/growth-metrics
**Purpose**: Business growth analytics

## 3. Customer Management Endpoints

### GET /customers
**Purpose**: List all customers with filtering and pagination

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search by name, phone, or email
- `tags`: Filter by customer tags
- `status`: active, inactive
- `sort`: name, created_at, last_contact

### POST /customers
**Purpose**: Create new customer

```json
{
  "name": "Maria Silva",
  "email": "maria@example.com",
  "phone": "+5511999999999",
  "address": "Rua das Flores, 123",
  "city": "São Paulo",
  "state": "SP",
  "zip_code": "01234-567",
  "emergency_contact": {
    "name": "João Silva",
    "phone": "+5511888888888",
    "relationship": "spouse"
  },
  "notes": "Cliente preferencial",
  "tags": ["vip", "frequent"]
}
```

### GET /customers/:id
**Purpose**: Get specific customer details

### PUT /customers/:id
**Purpose**: Update customer information

### DELETE /customers/:id
**Purpose**: Soft delete customer (set is_active = false)

### GET /customers/:id/pets
**Purpose**: Get all pets for a customer

### GET /customers/:id/appointments
**Purpose**: Get all appointments for a customer

### GET /customers/:id/conversations
**Purpose**: Get all conversations for a customer

### GET /customers/:id/orders
**Purpose**: Get all orders for a customer

### POST /customers/:id/notes
**Purpose**: Add note to customer

### GET /customers/search
**Purpose**: Advanced customer search with filters

## 4. Pet Management Endpoints

### GET /pets
**Purpose**: List all pets with filtering

**Query Parameters**:
- `customer_id`: Filter by customer
- `species`: Filter by species
- `breed`: Filter by breed
- `age_range`: young, adult, senior

### POST /pets
**Purpose**: Create new pet profile

```json
{
  "customer_id": "uuid",
  "name": "Rex",
  "species": "Dog",
  "breed": "Golden Retriever",
  "color": "Golden",
  "gender": "male",
  "birth_date": "2020-05-15",
  "weight": 25.5,
  "microchip_number": "123456789",
  "special_needs": "Needs daily medication",
  "allergies": ["chicken", "dairy"],
  "medications": [
    {
      "name": "Medicine A",
      "dosage": "1 tablet daily",
      "prescribed_by": "Dr. Smith"
    }
  ]
}
```

### GET /pets/:id
**Purpose**: Get specific pet details

### PUT /pets/:id
**Purpose**: Update pet information

### DELETE /pets/:id
**Purpose**: Soft delete pet

### POST /pets/:id/photo
**Purpose**: Upload pet photo

### GET /pets/:id/health-records
**Purpose**: Get pet's health history

### POST /pets/:id/health-records
**Purpose**: Add health record

### GET /pets/:id/appointments
**Purpose**: Get pet's appointments

## 5. Appointment Management Endpoints

### GET /appointments
**Purpose**: List appointments with filtering

**Query Parameters**:
- `date`: Filter by specific date
- `date_range`: start_date,end_date
- `status`: scheduled, confirmed, in_progress, completed, cancelled
- `assigned_to`: Filter by staff member
- `customer_id`: Filter by customer
- `pet_id`: Filter by pet
- `type`: appointment type filter

### POST /appointments
**Purpose**: Create new appointment

```json
{
  "customer_id": "uuid",
  "pet_id": "uuid",
  "assigned_to": "uuid",
  "title": "Grooming Appointment",
  "description": "Full grooming service",
  "appointment_type": "grooming",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T11:30:00Z",
  "estimated_cost": 150.00,
  "notes": "Pet is nervous, handle with care"
}
```

### GET /appointments/:id
**Purpose**: Get appointment details

### PUT /appointments/:id
**Purpose**: Update appointment

### DELETE /appointments/:id
**Purpose**: Cancel appointment

### POST /appointments/:id/confirm
**Purpose**: Confirm appointment

### POST /appointments/:id/start
**Purpose**: Start appointment (in_progress status)

### POST /appointments/:id/complete
**Purpose**: Complete appointment with notes and actual cost

### GET /appointments/calendar
**Purpose**: Calendar view data

### GET /appointments/availability
**Purpose**: Check staff/resource availability

### POST /appointments/:id/reschedule
**Purpose**: Reschedule appointment

## 6. Conversation Management Endpoints

### GET /conversations
**Purpose**: List WhatsApp conversations

**Query Parameters**:
- `status`: active, resolved, escalated, archived
- `assigned_to`: Filter by assigned staff
- `priority`: normal, high, urgent
- `search`: Search in conversation content
- `date_range`: Filter by date range

### GET /conversations/:id
**Purpose**: Get conversation details with messages

### PUT /conversations/:id
**Purpose**: Update conversation (assign, priority, tags)

### POST /conversations/:id/messages
**Purpose**: Send message in conversation

```json
{
  "content": "Hello! How can I help you today?",
  "message_type": "text",
  "sender_type": "human"
}
```

### GET /conversations/:id/messages
**Purpose**: Get conversation messages

### POST /conversations/:id/escalate
**Purpose**: Escalate conversation to human

### POST /conversations/:id/resolve
**Purpose**: Mark conversation as resolved

### POST /conversations/:id/assign
**Purpose**: Assign conversation to staff member

### GET /conversations/pending
**Purpose**: Get conversations pending human response

### GET /conversations/metrics
**Purpose**: Conversation analytics and metrics

## 7. AI Configuration Endpoints

### GET /ai/configurations
**Purpose**: List AI configurations

### POST /ai/configurations
**Purpose**: Create AI configuration

```json
{
  "name": "Customer Service Assistant",
  "system_prompt": "You are a helpful pet care assistant...",
  "personality": "friendly",
  "temperature": 0.7,
  "max_tokens": 150,
  "response_delay_seconds": 2,
  "escalation_keywords": ["human", "manager", "complaint"],
  "auto_reply_enabled": true,
  "business_hours_only": false
}
```

### GET /ai/configurations/:id
**Purpose**: Get AI configuration

### PUT /ai/configurations/:id
**Purpose**: Update AI configuration

### DELETE /ai/configurations/:id
**Purpose**: Delete AI configuration

### POST /ai/configurations/:id/test
**Purpose**: Test AI configuration with sample input

### GET /ai/configurations/:id/metrics
**Purpose**: AI performance metrics

### POST /ai/configurations/:id/activate
**Purpose**: Activate AI configuration

## 8. Catalog Management Endpoints

### GET /catalog
**Purpose**: List products/services

**Query Parameters**:
- `category`: Filter by category
- `is_active`: Filter active items
- `price_range`: min,max price filter
- `requires_appointment`: Filter by appointment requirement

### POST /catalog
**Purpose**: Create new catalog item

```json
{
  "name": "Dog Grooming - Full Service",
  "description": "Complete grooming service including bath, cut, nail trim",
  "category": "grooming",
  "price": 120.00,
  "duration_minutes": 90,
  "requires_appointment": true,
  "tags": ["popular", "premium"]
}
```

### GET /catalog/:id
**Purpose**: Get catalog item details

### PUT /catalog/:id
**Purpose**: Update catalog item

### DELETE /catalog/:id
**Purpose**: Soft delete catalog item

### POST /catalog/:id/image
**Purpose**: Upload item image

### GET /catalog/categories
**Purpose**: Get all categories

## 9. Order Management Endpoints

### GET /orders
**Purpose**: List orders with filtering

### POST /orders
**Purpose**: Create new order

```json
{
  "customer_id": "uuid",
  "items": [
    {
      "catalog_item_id": "uuid",
      "pet_id": "uuid",
      "quantity": 1,
      "scheduled_date": "2024-01-15T10:00:00Z"
    }
  ],
  "notes": "Customer requested early morning slot"
}
```

### GET /orders/:id
**Purpose**: Get order details

### PUT /orders/:id
**Purpose**: Update order

### POST /orders/:id/confirm
**Purpose**: Confirm order

### POST /orders/:id/cancel
**Purpose**: Cancel order

### POST /orders/:id/payment
**Purpose**: Process payment for order

## 10. Analytics Endpoints

### GET /analytics/dashboard
**Purpose**: Dashboard analytics summary

### GET /analytics/customers
**Purpose**: Customer analytics and insights

### GET /analytics/appointments
**Purpose**: Appointment analytics

### GET /analytics/conversations
**Purpose**: Conversation analytics

### GET /analytics/ai-performance
**Purpose**: AI performance metrics

### GET /analytics/revenue
**Purpose**: Revenue analytics

### GET /analytics/staff-performance
**Purpose**: Staff performance metrics

### POST /analytics/export
**Purpose**: Export analytics data

## 11. Settings Endpoints

### GET /settings
**Purpose**: Get organization settings

### PUT /settings
**Purpose**: Update organization settings

### GET /settings/whatsapp
**Purpose**: Get WhatsApp integration settings

### PUT /settings/whatsapp
**Purpose**: Update WhatsApp settings

### POST /settings/whatsapp/test
**Purpose**: Test WhatsApp connection

### GET /settings/notifications
**Purpose**: Get notification preferences

### PUT /settings/notifications
**Purpose**: Update notification preferences

### GET /settings/users
**Purpose**: List organization users

### POST /settings/users
**Purpose**: Create new user

### PUT /settings/users/:id
**Purpose**: Update user

### DELETE /settings/users/:id
**Purpose**: Deactivate user

## 12. Follow-up Management Endpoints

### GET /follow-ups
**Purpose**: List follow-up tasks

### POST /follow-ups
**Purpose**: Create follow-up task

### GET /follow-ups/:id
**Purpose**: Get follow-up details

### PUT /follow-ups/:id
**Purpose**: Update follow-up

### POST /follow-ups/:id/complete
**Purpose**: Mark follow-up as completed

### GET /follow-ups/due
**Purpose**: Get overdue follow-ups

### GET /follow-ups/upcoming
**Purpose**: Get upcoming follow-ups

## 13. File Upload Endpoints

### POST /uploads/images
**Purpose**: Upload images (pets, profile photos)

### POST /uploads/documents
**Purpose**: Upload documents (health records, invoices)

### GET /uploads/:id
**Purpose**: Get file metadata

### DELETE /uploads/:id
**Purpose**: Delete uploaded file

## 14. Search Endpoints

### GET /search/global
**Purpose**: Global search across all entities

**Query Parameters**:
- `q`: Search query
- `entities`: customers,pets,appointments,conversations
- `limit`: Result limit

### GET /search/customers
**Purpose**: Advanced customer search

### GET /search/conversations
**Purpose**: Search conversation content

## 15. Real-time Endpoints (WebSocket)

### Connection: `/api/v1/ws`
**Purpose**: Real-time updates for dashboard and conversations

**Events Emitted**:
- `new_message`: New WhatsApp message received
- `conversation_assigned`: Conversation assigned to user
- `appointment_updated`: Appointment status changed
- `customer_activity`: Customer interaction detected
- `ai_escalation`: AI escalated conversation to human

**Events Listened**:
- `join_room`: Join organization room for updates
- `send_message`: Send WhatsApp message
- `typing_start`: Start typing indicator
- `typing_stop`: Stop typing indicator

## 16. Health Check Endpoints

### GET /health
**Purpose**: System health check

### GET /health/database
**Purpose**: Database connectivity check

### GET /health/whatsapp
**Purpose**: WhatsApp API health

### GET /health/ai
**Purpose**: AI service health

## Authentication & Authorization

### JWT Token Structure
```json
{
  "sub": "user_uuid",
  "email": "user@example.com",
  "organization_id": "org_uuid",
  "role": "admin",
  "iat": 1640995200,
  "exp": 1641081600
}
```

### Role-Based Permissions
- **admin**: Full access to all endpoints
- **manager**: All except user management and critical settings
- **staff**: Customer, pet, appointment, and conversation management
- **viewer**: Read-only access to most data

### Rate Limiting
- **Authentication endpoints**: 5 requests per minute per IP
- **API endpoints**: 100 requests per minute per user
- **File uploads**: 10 requests per minute per user
- **Search endpoints**: 50 requests per minute per user

## Validation Rules

### Common Validations
- All UUIDs must be valid format
- Timestamps must be ISO 8601 format
- Phone numbers must match +55XXXXXXXXXXX pattern
- Email addresses must be valid format
- Required fields cannot be null or empty

### Business Logic Validations
- Appointments cannot overlap for same resource
- Messages cannot be sent to non-existent conversations
- Customers cannot be deleted if they have active appointments
- AI configurations require valid model parameters

## Error Codes

- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `AUTH_003`: Insufficient permissions
- `VAL_001`: Validation error
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict
- `RATE_LIMIT`: Rate limit exceeded
- `INTEGRATION_ERROR`: External service error
- `INTERNAL_ERROR`: Internal server error

This API specification covers all 107 dead functionalities identified in the audit, providing a complete backend foundation for the resurrected Auzap system.