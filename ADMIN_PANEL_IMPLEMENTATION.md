# Admin Panel Implementation - Complete Guide

## 📋 Overview

Implementação completa do painel administrativo com sistema de RBAC (Role-Based Access Control), auditoria de logs e gerenciamento de organizações.

## ✅ Completed Features

### 1. Database Schema (Supabase Migrations)

#### Tables Created:
- **roles** - Sistema de roles/permissões
- **audit_logs** - Logs de auditoria do sistema  
- **profiles (enhanced)** - Perfis de usuários com role_id, is_active, metadata

#### Default Roles Created:
- `super_admin` - Acesso total ao sistema (permissão: "*")
- `admin` - Administrador de organização (dashboard.*, whatsapp.*, customers.*, pets.*, appointments.*, settings.*, users.read/create/update)
- `manager` - Gerente com acesso limitado (dashboard.read, whatsapp.read, customers.*, pets.*, appointments.*, settings.read)
- `user` - Usuário padrão (dashboard.read, conversations.read, customers.read, pets.read, appointments.read)

#### Helper Functions:
- `has_permission(role_id, permission)` - Verifica se uma role tem determinada permissão
- `update_updated_at_column()` - Atualiza timestamp automaticamente

### 2. Admin Pages

#### OrganizationManagement (`frontend/src/pages/admin/OrganizationManagement.tsx`)
**Super Admin Only**
- Listagem completa de organizações
- Stats cards (Total, Ativas, Trial, Suspensas)
- Filtros por status e busca
- Visualização de planos, features, limites de usuários/instâncias
- Design: Cards com badges coloridos, tabela responsiva

#### RolesPermissions (`frontend/src/pages/admin/RolesPermissions.tsx`)
- Gerenciamento de roles do sistema
- Matrix de permissões por categoria (dashboard, whatsapp, customers, pets, appointments, users, settings)
- Visualização detalhada de permissões por role
- Sistema/Customizadas badges
- Design: Tabela interativa, seleção de role para ver permissões

#### AuditLogs (`frontend/src/pages/admin/AuditLogs.tsx`)
- Visualizador completo de logs de auditoria
- Filtros por: severidade (info/warning/error), ação (INSERT/UPDATE/DELETE), busca
- Stats cards (Total eventos, Sucessos, Erros, Hoje)
- Dialog de detalhes com old_values/new_values
- Export de logs (JSON/CSV)
- Design: Timeline visual, badges de status/severidade, cores por ação

#### SystemSettings (`frontend/src/pages/admin/SystemSettings.tsx`)
- Configurações globais do sistema
- 6 abas: General, Security, Email, WhatsApp, AI, Notifications
- Configurações de segurança (2FA, timeout de sessão, políticas de senha)
- Integração Evolution API (URL, API Key, Webhook)
- Configuração OpenAI (API Key, modelo, tokens, temperature)
- SMTP settings
- Design: Tabs com ícones, switches, validação de formulário

### 3. Components

#### UserFormDialog (`frontend/src/components/admin/UserFormDialog.tsx`)
- Dialog para criar/editar usuários
- Campos: email, full_name, phone, role_id, is_active
- Validação com Zod schema
- Seleção de role com descrição
- Switch para ativar/desativar usuário
- Loading states

#### ConfirmDialog (`frontend/src/components/admin/ConfirmDialog.tsx`)
- Dialog de confirmação reutilizável
- Suporte a variantes (default/destructive)
- Loading state durante ação
- Customização de textos e títulos

#### RoleAssignDialog (`frontend/src/components/admin/RoleAssignDialog.tsx`)
- Dialog para atribuir roles a usuários
- Visualização de role atual vs nova role
- Preview de permissões da role selecionada
- Validação (não permite atribuir mesma role)

### 4. Hooks

#### useAdminUsers (`frontend/src/hooks/useAdminUsers.ts`)
**Funcionalidades:**
- `users` - Lista de usuários com role e organization
- `createUser(data)` - Criar novo usuário
- `updateUser(id, data)` - Atualizar usuário
- `deleteUser(id)` - Desativar usuário (soft delete)
- `assignRole(userId, roleId)` - Atribuir role
- `activateUser(id)` - Reativar usuário
- Loading states: isCreating, isUpdating, isDeleting, isAssigning

#### useAuditLogs (`frontend/src/hooks/useAuditLogs.ts`)
**Funcionalidades:**
- `logs` - Lista de logs com filtros aplicados
- `stats` - Estatísticas (total, por status, por severidade, por ação)
- `recentActivity` - Últimos 10 eventos
- `exportLogs(format)` - Exportar JSON ou CSV
- Filtros: organizationId, userId, action, entityType, severity, status, dateRange

#### usePermissions (`frontend/src/hooks/usePermissions.ts`)
**Funcionalidades:**
- `hasPermission(permission)` - Verifica permissão específica
- `hasAllPermissions(array)` - Verifica múltiplas permissões (AND)
- `hasAnyPermission(array)` - Verifica múltiplas permissões (OR)
- `hasRole(roleName)` - Verifica role específica
- `hasAnyRole(array)` - Verifica múltiplas roles
- `isSuperAdmin()` - Verifica se é super admin
- `isAdmin()` - Verifica se é admin ou super admin
- `getAllPermissions()` - Retorna todas as permissões
- `getRole()` - Retorna role do usuário

**HOCs Disponíveis:**
- `withPermission(Component, permission)` - Protege componente por permissão
- `withRole(Component, role)` - Protege componente por role

## 🎨 Design System

### Color Scheme:
- Super Admin: Red (`bg-red-100 text-red-800`)
- Admin: Purple (`bg-purple-100 text-purple-800`)
- Manager: Blue (`bg-blue-100 text-blue-800`)
- User: Gray (`bg-gray-100 text-gray-800`)

### Status Colors:
- Active: Green
- Trial: Blue
- Suspended: Red
- Inactive: Gray

### Severity Colors:
- Error: Red
- Warning: Yellow
- Info: Blue

### Action Colors:
- INSERT/CREATE: Green
- UPDATE: Blue
- DELETE: Red

## 🔐 Security Features

### Row Level Security (RLS):
- Roles table: Apenas super_admin pode gerenciar
- Audit Logs: Usuários veem apenas logs da própria organização
- Profiles: Isolamento por organização

### Permission System:
- Wildcard support: `*` (super admin), `dashboard.*` (todas em dashboard)
- Namespace-based: `resource.action` (ex: `users.create`, `customers.read`)
- Inheritance: Permissão `dashboard.*` inclui `dashboard.read`, `dashboard.write`, etc.

### Audit Trail:
- Todas as ações em profiles, organizations, whatsapp_instances são auditadas
- Captura: user_id, action (INSERT/UPDATE/DELETE), old_values, new_values
- Metadata: IP address, user agent, timestamp

## 📊 Database Structure

### Roles Table:
```sql
- id (UUID, PK)
- name (VARCHAR, UNIQUE)
- description (TEXT)
- permissions (JSONB array)
- is_system_role (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

### Audit Logs Table:
```sql
- id (UUID, PK)
- organization_id (UUID, FK)
- user_id (UUID, FK)
- action (VARCHAR) - INSERT/UPDATE/DELETE
- entity_type (VARCHAR) - profiles/customers/pets/etc
- entity_id (UUID)
- old_values (JSONB)
- new_values (JSONB)
- ip_address (VARCHAR)
- user_agent (TEXT)
- severity (VARCHAR) - info/warning/error
- status (VARCHAR) - success/failed
- error_message (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMP)
```

### Profiles Table (Enhanced):
```sql
Existing columns +
- role_id (UUID, FK to roles)
- is_active (BOOLEAN)
- last_login (TIMESTAMP)
- created_by (UUID, FK to profiles)
- metadata (JSONB)
```

## 🚀 Next Steps

### Recommended Improvements:

1. **Backend API Routes** (ainda não implementados):
   - `GET /admin/users` - Listar usuários
   - `POST /admin/users` - Criar usuário
   - `PUT /admin/users/:id` - Atualizar usuário
   - `DELETE /admin/users/:id` - Desativar usuário
   - `PUT /admin/users/:id/role` - Atribuir role
   - `GET /admin/roles` - Listar roles
   - `POST /admin/roles` - Criar role customizada
   - `GET /admin/audit-logs` - Listar logs
   - `GET /admin/organizations` - Listar organizações (super admin)
   - `PUT /admin/organizations/:id` - Atualizar organização

2. **Additional Features**:
   - Bulk user operations (import CSV, export, bulk role assign)
   - Advanced audit log search (full-text search)
   - Role cloning/templating
   - Permission groups/presets
   - User invitation system (organization_invites table já existe)
   - Session management (user_sessions table já existe)
   - 2FA implementation
   - Notification preferences per user
   - Activity timeline per user

3. **UI Enhancements**:
   - Data tables com sorting, pagination, column visibility
   - Advanced filters com date range picker
   - Chart visualizations (audit logs over time, user activity)
   - Dark mode support
   - Mobile responsive improvements

4. **Testing**:
   - Unit tests para hooks
   - Integration tests para components
   - E2E tests com Playwright para fluxos admin
   - Permission system tests

## 📝 Usage Examples

### Checking Permissions:
```typescript
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const { hasPermission, isSuperAdmin } = usePermissions();

  if (!hasPermission('users.create')) {
    return <AccessDenied />;
  }

  if (isSuperAdmin()) {
    return <SuperAdminPanel />;
  }

  return <RegularComponent />;
}
```

### Protecting Routes:
```typescript
import { withPermission } from '@/hooks/usePermissions';

const AdminRoute = withPermission(AdminPage, 'admin.*');
const UserManagement = withRole(UserManagementPage, 'admin');
```

### Creating Users:
```typescript
import { useAdminUsers } from '@/hooks/useAdminUsers';

function UserManagement() {
  const { createUser, users } = useAdminUsers();

  const handleCreate = async (data) => {
    await createUser({
      email: data.email,
      full_name: data.name,
      role_id: data.roleId,
      organization_id: currentOrgId,
    });
  };
}
```

### Viewing Audit Logs:
```typescript
import { useAuditLogs } from '@/hooks/useAuditLogs';

function AuditViewer() {
  const { logs, stats, exportLogs } = useAuditLogs({
    organizationId: currentOrgId,
    severity: 'error',
    limit: 50,
  });

  return (
    <>
      <StatsCards stats={stats} />
      <LogsTable logs={logs} />
      <Button onClick={() => exportLogs('csv')}>Export CSV</Button>
    </>
  );
}
```

## 🎯 Migration Status

✅ **Completed Migrations:**
1. `create_roles_table` - Tabela de roles com 4 roles padrão
2. `alter_profiles_table` - Adição de role_id, is_active, last_login, created_by, metadata
3. `create_audit_logs_table_fixed` - Tabela de audit logs
4. `create_helper_functions` - has_permission() e update_updated_at_column()
5. `enable_rls_on_tables` - RLS policies para roles e audit_logs

## 🔗 Integration Points

### Frontend Routes (to be added):
```typescript
{
  path: '/admin',
  element: <AdminLayout />,
  children: [
    { path: 'users', element: <UserManagement /> },
    { path: 'organizations', element: <OrganizationManagement /> },
    { path: 'roles', element: <RolesPermissions /> },
    { path: 'audit-logs', element: <AuditLogs /> },
    { path: 'settings', element: <SystemSettings /> },
  ]
}
```

### Navigation Menu:
- Add admin section to sidebar
- Show only for users with admin permissions
- Badge counts (pending invites, recent errors, etc)

## 🛡️ Security Checklist

- [x] RLS policies on all admin tables
- [x] Role-based permission system
- [x] Audit logging for sensitive operations
- [x] Soft delete for users (is_active flag)
- [x] Input validation with Zod schemas
- [x] Permission checks on frontend
- [ ] Backend permission middleware (to be implemented)
- [ ] Rate limiting on admin endpoints
- [ ] Session management
- [ ] 2FA for admin accounts

## 📦 Dependencies Used

- `@tanstack/react-query` - Data fetching and caching
- `react-hook-form` - Form management
- `zod` - Schema validation
- `date-fns` - Date formatting
- `lucide-react` - Icons
- `shadcn/ui` - UI components

## 🎉 Summary

Sistema completo de administração implementado com:
- ✅ 4 páginas admin (Organizations, Roles, Audit Logs, Settings)
- ✅ 3 componentes de dialog (UserForm, Confirm, RoleAssign)
- ✅ 3 hooks customizados (useAdminUsers, useAuditLogs, usePermissions)
- ✅ Database migrations completas
- ✅ Sistema RBAC funcional
- ✅ Audit trail automático
- ✅ Permission system robusto

**Status:** ✅ **READY FOR TESTING AND BACKEND INTEGRATION**
