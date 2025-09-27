# Data Schemas Specification

This document defines the complete database schema required for the Auzap system resurrection. Based on the audit findings, this schema addresses all 107 dead functionalities and ensures proper data flow throughout the system.

## Database Technology
- **Primary Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime with RLS policies
- **File Storage**: Supabase Storage for documents, images, and media

## Core Entity Relationships

```
Organizations (1) → (N) Users
Organizations (1) → (N) Customers
Organizations (1) → (N) Pets
Organizations (1) → (N) AI_Configurations
Customers (1) → (N) Pets
Customers (1) → (N) Appointments
Customers (1) → (N) Conversations
Conversations (1) → (N) Messages
Pets (1) → (N) Appointments
Pets (1) → (N) Health_Records
```

## 1. Organizations Table
**Purpose**: Multi-tenant support with organization isolation

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  whatsapp_api_config JSONB,
  business_settings JSONB,
  branding_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
```

**RLS Policy**: Users can only access their organization's data

## 2. Users Table (Supabase Auth Extended)
**Purpose**: Staff and admin user management

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'staff',
  avatar_url TEXT,
  phone VARCHAR(20),
  department VARCHAR(100),
  permissions JSONB DEFAULT '{}',
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Roles**: admin, manager, staff, viewer

## 3. Customers Table
**Purpose**: Client/pet owner information management

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  external_id VARCHAR(255), -- For WhatsApp integration
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  emergency_contact JSONB,
  notes TEXT,
  tags TEXT[],
  customer_since DATE DEFAULT CURRENT_DATE,
  total_spent DECIMAL(10,2) DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  preferred_contact_method VARCHAR(50) DEFAULT 'whatsapp',
  communication_preferences JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 4. Pets Table
**Purpose**: Pet profiles and basic information

```sql
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id),
  name VARCHAR(255) NOT NULL,
  species VARCHAR(100),
  breed VARCHAR(255),
  color VARCHAR(100),
  gender VARCHAR(10),
  birth_date DATE,
  weight DECIMAL(5,2),
  microchip_number VARCHAR(255),
  photo_url TEXT,
  special_needs TEXT,
  allergies TEXT[],
  medications JSONB,
  vaccination_status JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 5. Health Records Table
**Purpose**: Medical history and health tracking

```sql
CREATE TABLE health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  pet_id UUID REFERENCES pets(id),
  record_type VARCHAR(100), -- vaccination, exam, treatment, surgery, etc.
  date_performed DATE NOT NULL,
  veterinarian VARCHAR(255),
  diagnosis TEXT,
  treatment TEXT,
  medications JSONB,
  notes TEXT,
  attachments TEXT[], -- file URLs
  next_due_date DATE,
  cost DECIMAL(10,2),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 6. Appointments Table
**Purpose**: Scheduling system for all services

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id),
  pet_id UUID REFERENCES pets(id),
  assigned_to UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  appointment_type VARCHAR(100), -- grooming, vet, daycare, etc.
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, in_progress, completed, cancelled
  priority VARCHAR(20) DEFAULT 'normal',
  location VARCHAR(255),
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  notes TEXT,
  reminders_sent INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 7. Conversations Table
**Purpose**: WhatsApp conversation threads

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id),
  whatsapp_chat_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, resolved, escalated, archived
  assigned_to UUID REFERENCES users(id),
  priority VARCHAR(20) DEFAULT 'normal',
  subject VARCHAR(255),
  tags TEXT[],
  sentiment_score DECIMAL(3,2), -- -1 to 1
  escalation_level INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  response_time_minutes INTEGER,
  resolution_time_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 8. Messages Table
**Purpose**: Individual WhatsApp messages

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  conversation_id UUID REFERENCES conversations(id),
  whatsapp_message_id VARCHAR(255) NOT NULL,
  sender_type VARCHAR(20) NOT NULL, -- customer, ai, human
  sender_id UUID, -- references users(id) for human, null for AI
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text', -- text, image, document, audio, etc.
  media_url TEXT,
  media_type VARCHAR(100),
  is_automated BOOLEAN DEFAULT false,
  ai_confidence DECIMAL(3,2),
  sentiment_score DECIMAL(3,2),
  language VARCHAR(10) DEFAULT 'pt-BR',
  processed_by_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 9. AI Configurations Table
**Purpose**: AI assistant settings per organization

```sql
CREATE TABLE ai_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  system_prompt TEXT,
  context_prompt TEXT,
  personality VARCHAR(50), -- friendly, professional, casual, etc.
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 150,
  response_delay_seconds INTEGER DEFAULT 2,
  escalation_keywords TEXT[],
  auto_reply_enabled BOOLEAN DEFAULT true,
  business_hours_only BOOLEAN DEFAULT false,
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 10. AI Interaction Logs Table
**Purpose**: AI decision tracking and optimization

```sql
CREATE TABLE ai_interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  conversation_id UUID REFERENCES conversations(id),
  message_id UUID REFERENCES messages(id),
  ai_config_id UUID REFERENCES ai_configurations(id),
  prompt_used TEXT,
  response_generated TEXT,
  processing_time_ms INTEGER,
  tokens_used INTEGER,
  confidence_score DECIMAL(3,2),
  escalation_triggered BOOLEAN DEFAULT false,
  escalation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 11. Products/Services Catalog Table
**Purpose**: Service offerings and pricing

```sql
CREATE TABLE catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- grooming, veterinary, daycare, retail, etc.
  price DECIMAL(10,2),
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  requires_appointment BOOLEAN DEFAULT true,
  image_url TEXT,
  tags TEXT[],
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 12. Orders Table
**Purpose**: Service bookings and transactions

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id),
  order_number VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, in_progress, completed, cancelled
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(100),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 13. Order Items Table
**Purpose**: Individual items within orders

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  catalog_item_id UUID REFERENCES catalog_items(id),
  pet_id UUID REFERENCES pets(id),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  notes TEXT
);
```

## 14. Follow-up Tasks Table
**Purpose**: Automated and manual follow-up management

```sql
CREATE TABLE follow_up_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id),
  conversation_id UUID REFERENCES conversations(id),
  assigned_to UUID REFERENCES users(id),
  task_type VARCHAR(100), -- reminder, check_up, feedback, etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  automated BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 15. Analytics Tables

### Message Analytics
```sql
CREATE TABLE message_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  date DATE NOT NULL,
  total_messages INTEGER DEFAULT 0,
  ai_messages INTEGER DEFAULT 0,
  human_messages INTEGER DEFAULT 0,
  escalated_conversations INTEGER DEFAULT 0,
  average_response_time_minutes DECIMAL(10,2),
  customer_satisfaction_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Customer Insights
```sql
CREATE TABLE customer_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id),
  metric_name VARCHAR(100),
  metric_value DECIMAL(10,2),
  metric_date DATE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 16. Settings and Configuration Tables

### Organization Settings
```sql
CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  setting_category VARCHAR(100), -- whatsapp, ai, business, notifications
  setting_key VARCHAR(255),
  setting_value JSONB,
  is_encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, setting_category, setting_key)
);
```

### Notification Preferences
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  notification_type VARCHAR(100),
  delivery_method VARCHAR(50), -- email, whatsapp, in_app
  is_enabled BOOLEAN DEFAULT true,
  schedule_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 17. Audit and Logging Tables

### Audit Log
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### System Logs
```sql
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  level VARCHAR(20), -- error, warn, info, debug
  source VARCHAR(100), -- api, ai, whatsapp, etc.
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Row Level Security (RLS) Policies

All tables must implement RLS to ensure proper multi-tenant isolation:

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ... (repeat for all tables)

-- Basic organization isolation policy template
CREATE POLICY "Organization isolation" ON {table_name}
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = auth.uid()
    )
  );
```

## Indexes for Performance

```sql
-- Core performance indexes
CREATE INDEX idx_customers_organization_phone ON customers(organization_id, phone);
CREATE INDEX idx_conversations_customer_status ON conversations(customer_id, status);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_appointments_organization_date ON appointments(organization_id, start_time);
CREATE INDEX idx_ai_logs_organization_created ON ai_interaction_logs(organization_id, created_at DESC);
```

## Data Validation Rules

### Customer Phone Validation
- Must be unique per organization
- Format: +55XXXXXXXXXXX (Brazilian format)
- Required for WhatsApp integration

### Appointment Scheduling Rules
- End time must be after start time
- No overlapping appointments for same pet
- Business hours validation

### Message Ordering
- Messages must maintain chronological order
- WhatsApp message IDs must be unique
- Conversation last_message_at auto-update trigger

## Real-time Subscriptions

Enable real-time updates for:
- New messages in conversations
- Appointment status changes
- AI escalations to humans
- Customer status updates
- Dashboard metrics updates

```sql
-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
```

## Backup and Recovery Strategy

- **Daily automated backups** via Supabase
- **Point-in-time recovery** available
- **Data retention**: 30 days for messages, 7 years for customer/pet records
- **GDPR compliance**: Data anonymization procedures

This schema provides the foundation for all 107 functionalities identified in the audit, ensuring proper data relationships, security, and performance for the resurrected Auzap system.