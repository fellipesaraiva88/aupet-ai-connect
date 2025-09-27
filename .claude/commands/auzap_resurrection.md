# Auzap Resurrection Orchestrator Command

You are the **Orchestrator** for the "Auzap System Resurrection" workflow. You will oversee the execution of the multi-agent system designed to transform the Auzap system from a non-functional mockup into a fully working application.

## Output Directory
All outputs must be saved to: `./outputs/auzap_resurrection_{timestamp}/`
(Generate a timestamped folder using current date-time to avoid collisions.)

## Workflow Execution Steps

### 1. **Load Configuration**
First, read the workflow config from `./docs/tasks/auzap_resurrection/config.md` to understand the agents and phases.

### 2. **Initialize Output Directory**
Create a new output folder as `./outputs/auzap_resurrection_{timestamp}/` using current date-time as timestamp.

### 3. **Phase 0: Architecture Definition**
Launch Agent A (System Architect) to create all specifications and contracts:
- Read the complete audit report context from `./docs/tasks/auzap_resurrection/audit_context.md`
- Agent A creates: api_contracts.md, data_schemas.md, auth_specifications.md, integration_specs.md, environment_config.md
- Save outputs to `specifications/` folder
- **CRITICAL:** Do not proceed to Phase 1 until all specification files are complete and validated

### 4. **Phase 0 Evaluation**
Validate that all specifications are complete:
- Check that all 5 specification files exist and are non-empty
- Verify no circular dependencies exist
- Ensure all required integrations are documented
- If validation fails, have Agent A revise specifications

### 5. **Phase 1A: Core Infrastructure (Parallel)**
Launch Agents D, E, F, G simultaneously to build backend foundation:
- **Agent D (Backend API Builder):** Build API endpoints based on api_contracts.md
- **Agent E (Supabase Connector):** Fix database connections and environment setup
- **Agent F (Auth Specialist):** Implement authentication system
- **Agent G (Data Flow Engineer):** Create database schema and operations
- Save each agent's output to `phase1a/[agent_name]_output/`

### 6. **Phase 1A Checkpoint (2 hours)**
After 2 hours of Phase 1A work, run intermediate evaluation:
- Verify all API endpoints are responding correctly
- Test database connections work
- Validate authentication flow is functional
- Check environment variables are properly configured
- If issues found, pause and resolve before continuing

### 7. **Phase 1B: Frontend Implementation (Parallel)**
Launch Agents B, C, H simultaneously for UI fixes:
- **Agent B (UI Surgeon):** Fix all 107 dead button handlers using API contracts
- **Agent C (Navigation Specialist):** Fix routing and navigation systems
- **Agent H (Mock Data Replacer):** Replace all mockdata with real queries
- Save each agent's output to `phase1b/[agent_name]_output/`
- **DEPENDENCY:** Ensure Phase 1A API endpoints are available before starting Phase 1B

### 8. **Phase 1B Checkpoint (2 hours)**
After 2 hours of Phase 1B work, run intermediate evaluation:
- Verify all page components compile without errors
- Test navigation system works
- Confirm no mockdata remains in UI components
- If issues found, coordinate fixes before proceeding

### 9. **Phase 2: Integration Testing**
Launch Agent I (Quality Assurance) to test complete system integration:
- Test all frontend-backend integrations
- Validate end-to-end user flows work
- Run comprehensive test suite on all 107 previously dead functionalities
- Save test results to `phase2/test_results/`
- **SUCCESS CRITERIA:** All core user flows must work, zero critical bugs

### 10. **Phase 2 Evaluation**
Review Agent I's integration test results:
- If tests pass with no critical issues: proceed to Phase 3
- If critical issues found: return to appropriate phase for fixes and re-test
- **DO NOT PROCEED** until integration tests achieve acceptable success rate (95%+)

### 11. **Phase 3: Final Validation**
Agent I performs comprehensive system audit against original audit findings:
- Re-audit all 10 pages against original checklist
- Verify all 107 dead functionalities now work
- Validate system performance and security
- Create final audit report comparing before/after state
- Save to `phase3/final_audit_report.md`

### 12. **Final Integration and Deployment Package**
Create complete deployment package:
- Consolidate all working code into `final/integrated_system/`
- Generate deployment guide in `final/deployment_guide.md`
- Create handover documentation in `final/handover_docs.md`
- **DELIVERABLE:** Fully functional Auzap system ready for production

## File Management
- **Phase outputs:** Stored in subfolders `phase0/`, `phase1a/`, `phase1b/`, `phase2/`, `phase3/` as outlined
- **Evaluation reports:** Stored in `evaluations/` subfolder with timestamps
- **Specifications:** Stored in `specifications/` folder for agent reference
- **Final deliverable:** Complete system in `final/` folder

## Error Handling
- **If any agent fails:** Do not crash. Log the error and attempt recovery or re-prompting with clarifications
- **If prerequisites missing:** Stop execution and notify user of missing requirements
- **If Phase evaluations fail:** Return to appropriate phase for fixes before proceeding
- **Critical failure recovery:** Implement rollback to last successful checkpoint

## Pre-Requisites
**IMPORTANT:** Before running, ensure the following are available:
- **Supabase Project:** Configured with proper environment variables and database access
- **Evolution API Access:** Valid API key and endpoint access for WhatsApp integration
- **Development Environment:** Node.js 18+, npm/yarn, all project dependencies installed
- **Git Repository:** Properly configured for code collaboration and version control
- **Environment Variables:** All required .env files configured per audit findings

## Execution Notes
- **Follow sequence strictly:** Each phase builds on previous outputs
- **Provide informative logs:** Print progress updates at each major step
- **Monitor agent performance:** If any agent falls significantly behind, investigate and assist
- **Maintain coordination:** Ensure agents can communicate via shared `./coordination/` folder if needed
- **Quality gates:** Do not compromise on evaluation criteria - better to iterate than deploy broken features

## Inter-Agent Communication
- **Coordination folder:** `./coordination/questions.md` for agent questions and responses
- **Specification updates:** If specs need revision, update in `specifications/` folder and notify dependent agents
- **Conflict resolution:** System Architect (Agent A) makes final technical decisions
- **Progress tracking:** Maintain `./coordination/progress_log.md` with agent status updates

## Success Criteria
- **Functional transformation:** System goes from 6% to 95%+ functionality
- **All buttons work:** 107 previously dead functionalities now operational
- **Real data flow:** Zero mockdata remains, all operations use real Supabase data
- **Authentication works:** Complete login/logout/session management functional
- **Production ready:** System passes all security, performance, and reliability checks