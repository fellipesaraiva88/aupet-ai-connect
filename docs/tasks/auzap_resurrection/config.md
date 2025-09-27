# Auzap Resurrection Workflow Configuration

## Overview
- **Description:** Transform Auzap system from 6% functional mockup to 95%+ working application
- **Agents:** 9 specialized agents working in coordinated phases with parallel execution
- **Timeline:** 8-12 hours total across 4 phases with intermediate checkpoints

## Workflow Structure

### Phase 0: Architecture Definition (Sequential)
- **Agent A (System Architect)** – Creates all technical specifications and contracts
- **Duration:** 1-2 hours
- **Output:** 5 specification files defining APIs, schemas, auth, and integration patterns

### Phase 1A: Core Infrastructure (Parallel - 4 agents)
- **Agent D (Backend API Builder)** – Creates API endpoints and service integrations
- **Agent E (Supabase Connector)** – Fixes database connections and environment setup
- **Agent F (Auth Specialist)** – Implements complete authentication system
- **Agent G (Data Flow Engineer)** – Creates database schema and data operations
- **Duration:** 3-4 hours with 2-hour checkpoint
- **Dependencies:** All depend on Phase 0 specifications

### Phase 1B: Frontend Implementation (Parallel - 3 agents)
- **Agent B (UI Surgeon)** – Fixes all 107 dead button handlers and form interactions
- **Agent C (Navigation Specialist)** – Fixes routing, sidebar navigation, and page transitions
- **Agent H (Mock Data Replacer)** – Replaces all mockdata with real Supabase queries
- **Duration:** 3-4 hours with 2-hour checkpoint
- **Dependencies:** Phase 0 + some Phase 1A API endpoints

### Phase 2: Integration Testing (Sequential)
- **Agent I (Quality Assurance)** – Tests all components together and validates functionality
- **Duration:** 2-3 hours
- **Dependencies:** Both Phase 1A and 1B completion

### Phase 3: Final Validation (Sequential)
- **Agent I (Quality Assurance)** – Comprehensive system audit and production readiness
- **Duration:** 1-2 hours
- **Dependencies:** Phase 2 passing tests

## Agents and Roles

### **Agent A – System Architect**
**Purpose:** Define all technical contracts and specifications before parallel development begins
**Output:** `specifications/` folder with 5 complete specification files
**Critical Success Factor:** All other agents depend on these specifications being complete and correct

### **Agent B – UI Surgeon**
**Purpose:** Fix all dead onClick/onChange handlers and form interactions across all 10 pages
**Output:** `phase1b/ui_surgeon_output/` with updated .tsx files for all pages
**Scope:** 107 dead functionalities identified in audit, focusing purely on event handlers and UI state

### **Agent C – Navigation Specialist**
**Purpose:** Fix routing, sidebar navigation, and page transitions throughout the application
**Output:** `phase1b/navigation_specialist_output/` with updated navigation components and routing
**Scope:** React Router setup, sidebar onItemClick handlers, breadcrumbs, deep linking

### **Agent D – Backend API Builder**
**Purpose:** Create and implement all API endpoints and service integrations
**Output:** `phase1a/backend_api_builder_output/` with working API endpoints and service files
**Scope:** Express routes, middleware, Evolution API integration, WebSocket services

### **Agent E – Supabase Connector**
**Purpose:** Fix database connections, environment variables, and Supabase client configuration
**Output:** `phase1a/supabase_connector_output/` with corrected database integration
**Scope:** Environment config, Supabase client setup, connection testing, RLS policies

### **Agent F – Auth Specialist**
**Purpose:** Implement complete authentication system with login, session management, and route protection
**Output:** `phase1a/auth_specialist_output/` with full authentication system
**Scope:** LoginForm component, ProtectedRoute logic, user context, session persistence

### **Agent G – Data Flow Engineer**
**Purpose:** Create proper database schema and implement data operations for all entities
**Output:** `phase1a/data_flow_engineer_output/` with schema files and data access patterns
**Scope:** Database design, migrations, seed data, CRUD operations, data relationships

### **Agent H – Mock Data Replacer**
**Purpose:** Systematically replace all hardcoded mock arrays with real Supabase queries
**Output:** `phase1b/mock_data_replacer_output/` with real data integration
**Scope:** Remove all mockdata from pages, implement real queries, fix data flow

### **Agent I – Quality Assurance**
**Purpose:** Test integration, validate functionality, and perform final system audit
**Output:** `phase2/test_results/` and `phase3/final_audit_report.md`
**Scope:** End-to-end testing, functionality validation, performance testing, security audit

## File I/O Plan

### Phase 0 Specifications (Agent A produces, others consume):
- `specifications/api_contracts.md` → Used by Agents B, D, H
- `specifications/data_schemas.md` → Used by Agents E, G, H
- `specifications/auth_specifications.md` → Used by Agent F
- `specifications/integration_specs.md` → Used by Agents B, C
- `specifications/environment_config.md` → Used by Agent E

### Phase 1A Backend Outputs:
- `phase1a/backend_api_builder_output/` → API endpoints used by Agent B
- `phase1a/supabase_connector_output/` → Database config used by Agent H
- `phase1a/auth_specialist_output/` → Auth system used by Agent C
- `phase1a/data_flow_engineer_output/` → Schema used by Agents H, I

### Phase 1B Frontend Outputs:
- `phase1b/ui_surgeon_output/` → Updated pages for integration testing
- `phase1b/navigation_specialist_output/` → Navigation system for testing
- `phase1b/mock_data_replacer_output/` → Real data queries for validation

### Phase 2 & 3 Testing Outputs:
- `phase2/test_results/` → Integration test reports and logs
- `phase3/final_audit_report.md` → Complete system validation report
- `final/integrated_system/` → Production-ready codebase

## Output Directory Structure

```
./outputs/auzap_resurrection_{timestamp}/
├── specifications/
│   ├── api_contracts.md
│   ├── data_schemas.md
│   ├── auth_specifications.md
│   ├── integration_specs.md
│   └── environment_config.md
├── phase1a/
│   ├── backend_api_builder_output/
│   ├── supabase_connector_output/
│   ├── auth_specialist_output/
│   └── data_flow_engineer_output/
├── phase1b/
│   ├── ui_surgeon_output/
│   ├── navigation_specialist_output/
│   └── mock_data_replacer_output/
├── phase2/
│   └── test_results/
├── phase3/
│   └── final_audit_report.md
├── evaluations/
│   ├── phase0_evaluation.md
│   ├── phase1a_checkpoint.md
│   ├── phase1b_checkpoint.md
│   ├── phase2_evaluation.md
│   └── phase3_evaluation.md
├── coordination/
│   ├── questions.md
│   └── progress_log.md
└── final/
    ├── integrated_system/
    ├── deployment_guide.md
    └── handover_docs.md
```

## External Integration

**Required MCP Servers/Tools:**
- **Supabase MCP Server** – Essential for database operations, RLS policies, and real-time features
- **Environment Config MCP** – For secure management of API keys and environment variables
- **GitHub MCP Server** – For code repository management and version control integration
- **Evolution API MCP** – For WhatsApp integration testing and validation

**Optional but Recommended:**
- **Testing Framework MCP** – For automated test execution and continuous validation
- **Performance Monitoring MCP** – For system performance validation and optimization
- **Security Scanner MCP** – For vulnerability assessment and security validation

## Execution Notes

- **Prerequisites:** Ensure Supabase project, Evolution API access, and development environment are fully configured before starting
- **Quality Gates:** Each phase has strict evaluation criteria that must pass before proceeding
- **Coordination:** Agents communicate via shared coordination folder for questions and progress updates
- **Error Recovery:** Comprehensive rollback and retry mechanisms for failed phases
- **Success Metrics:** Transform system from 6% to 95%+ functionality with all 107 dead features working

## Critical Success Factors

1. **Complete Specifications:** Phase 0 must produce unambiguous, complete specifications
2. **Dependency Management:** Phase 1B cannot start until required Phase 1A outputs are available
3. **Quality Enforcement:** Do not compromise evaluation criteria for speed
4. **Real Data Flow:** Ensure zero mockdata remains in final system
5. **Production Readiness:** Final system must pass all security, performance, and reliability checks