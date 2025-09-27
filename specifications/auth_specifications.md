# Authentication Specifications

This document defines the complete authentication system required to resurrect the Auzap system. Based on the audit findings, the current authentication is completely non-functional with missing LoginForm component and empty ProtectedRoute components.

## Current State Issues

According to the audit:
- LoginForm component does not exist
- ProtectedRoute is empty shell that doesn't protect anything
- No session management or user context
- Anyone can access any page without authentication
- organizationId always returns 'default-org' instead of real user organization

## Authentication Architecture

### Technology Stack
- **Primary**: Supabase Auth (authentication service)
- **Frontend**: React Context for auth state management
- **Backend**: JWT token validation middleware
- **Session**: JWT tokens with automatic refresh
- **Security**: Row Level Security (RLS) for multi-tenant isolation

### Authentication Flow Overview

```
1. User enters credentials → LoginForm
2. Frontend validates input → Calls Supabase Auth
3. Supabase returns JWT token → Frontend stores token
4. All API requests include JWT → Backend validates token
5. Backend extracts organization_id → RLS policies enforce data isolation
6. Frontend updates auth context → UI reflects authenticated state
```

## 1. Frontend Authentication Components

### LoginForm Component
**Location**: `/frontend/src/components/auth/LoginForm.tsx`

```tsx
interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}
```

**Features**:
- Email/password input with validation
- "Remember me" checkbox for extended sessions
- Loading states during authentication
- Error handling with user-friendly messages
- Password strength indicator
- "Forgot password" link
- Social login options (Google, Microsoft if needed)
- Form validation using react-hook-form
- Accessibility compliant (ARIA labels, keyboard navigation)

**Validation Rules**:
- Email: Valid email format, required
- Password: Minimum 8 characters, required
- Real-time validation feedback
- Submit button disabled until valid

### AuthContext Component
**Location**: `/frontend/src/contexts/AuthContext.tsx`

```tsx
interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  organization_id: string;
  organization: {
    id: string;
    name: string;
    subscription_tier: string;
  };
  avatar_url?: string;
  permissions: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}
```

**State Management**:
- User authentication state
- Loading states for async operations
- Error states with detailed error messages
- Token management (storage, refresh, expiration)
- Organization context management
- Permission checking utilities

### ProtectedRoute Component
**Location**: `/frontend/src/components/auth/ProtectedRoute.tsx`

```tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  requiredPermission?: string | string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}
```

**Protection Logic**:
- Check if user is authenticated
- Verify required roles and permissions
- Redirect to login if unauthenticated
- Show access denied for insufficient permissions
- Support for nested route protection
- Loading states during auth check

### ForgotPasswordForm Component
**Location**: `/frontend/src/components/auth/ForgotPasswordForm.tsx`

**Features**:
- Email input for password reset
- Success/error messaging
- Rate limiting feedback
- Return to login link

### ResetPasswordForm Component
**Location**: `/frontend/src/components/auth/ResetPasswordForm.tsx`

**Features**:
- New password input with confirmation
- Password strength requirements
- Token validation
- Success redirect to login

### ProfileSettings Component
**Location**: `/frontend/src/components/auth/ProfileSettings.tsx`

**Features**:
- Update profile information
- Change password functionality
- Avatar upload
- Email change with verification
- Account deactivation option

## 2. Authentication API Integration

### Supabase Auth Configuration
**Location**: `/frontend/src/lib/auth.ts`

```typescript
interface AuthConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  redirectTo: string;
  autoRefreshToken: boolean;
  persistSession: boolean;
  detectSessionInUrl: boolean;
}
```

**Features**:
- Environment-based configuration (no hardcoded values)
- Automatic token refresh before expiration
- Session persistence across browser sessions
- Deep link handling after authentication
- Multi-tab session synchronization

### Authentication Service
**Location**: `/frontend/src/services/authService.ts`

```typescript
class AuthService {
  async signIn(email: string, password: string): Promise<AuthResponse>;
  async signOut(): Promise<void>;
  async resetPassword(email: string): Promise<void>;
  async updatePassword(password: string): Promise<void>;
  async refreshToken(): Promise<string>;
  async getCurrentUser(): Promise<AuthUser | null>;
  async updateProfile(updates: Partial<AuthUser>): Promise<AuthUser>;
  getStoredToken(): string | null;
  clearStoredToken(): void;
}
```

## 3. Backend Authentication Middleware

### JWT Validation Middleware
**Location**: `/backend/src/middleware/auth.ts`

```typescript
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    organization_id: string;
    role: string;
    permissions: string[];
  };
}
```

**Functionality**:
- Extract JWT from Authorization header
- Validate token signature and expiration
- Extract user information and organization context
- Attach user data to request object
- Handle token refresh scenarios
- Rate limiting per user
- Suspicious activity detection

### Role-Based Access Control (RBAC)
**Location**: `/backend/src/middleware/rbac.ts`

```typescript
const requireRole = (roles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Check if user has required role
  };
};

const requirePermission = (permissions: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Check if user has required permission
  };
};
```

**Permission System**:
- `customers.read`, `customers.write`, `customers.delete`
- `pets.read`, `pets.write`, `pets.delete`
- `appointments.read`, `appointments.write`, `appointments.delete`
- `conversations.read`, `conversations.write`, `conversations.assign`
- `ai.configure`, `ai.test`, `ai.monitor`
- `analytics.view`, `analytics.export`
- `settings.read`, `settings.write`
- `users.read`, `users.write`, `users.delete`
- `organization.admin`

## 4. Database Authentication Schema

### Extended User Profile
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role user_role DEFAULT 'staff',
  avatar_url TEXT,
  phone VARCHAR(20),
  department VARCHAR(100),
  permissions JSONB DEFAULT '[]',
  last_login TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff', 'viewer');
```

### Session Management
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Login Attempts Tracking
```sql
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255),
  ip_address INET,
  success BOOLEAN,
  failure_reason VARCHAR(255),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 5. Row Level Security (RLS) Policies

### Organization Isolation
```sql
-- Customers table
CREATE POLICY "Users can only access their organization's customers"
ON customers FOR ALL USING (
  organization_id = (
    SELECT organization_id FROM users
    WHERE id = auth.uid()
  )
);

-- Pets table
CREATE POLICY "Users can only access their organization's pets"
ON pets FOR ALL USING (
  organization_id = (
    SELECT organization_id FROM users
    WHERE id = auth.uid()
  )
);

-- Apply similar policies to all tables
```

### Role-Based Data Access
```sql
-- Admin can see all organization data
CREATE POLICY "Admins have full access"
ON customers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND organization_id = customers.organization_id
    AND role = 'admin'
  )
);

-- Staff can only see assigned customers
CREATE POLICY "Staff can only see assigned customers"
ON customers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND organization_id = customers.organization_id
    AND (role = 'admin' OR role = 'manager' OR assigned_staff_id = auth.uid())
  )
);
```

## 6. Security Implementation

### Token Management
- **JWT Expiration**: 1 hour for access tokens
- **Refresh Token**: 30 days with rotation
- **Storage**: HttpOnly cookies for refresh tokens, localStorage for access tokens
- **Automatic Refresh**: 5 minutes before expiration

### Password Security
- **Minimum Requirements**: 8 characters, 1 uppercase, 1 lowercase, 1 number
- **Hashing**: bcrypt with salt rounds = 12
- **Reset Tokens**: 15-minute expiration
- **History**: Prevent reuse of last 5 passwords

### Account Protection
- **Failed Login Limit**: 5 attempts before temporary lock
- **Lock Duration**: Progressive (5 min, 15 min, 1 hour, 24 hours)
- **Suspicious Activity**: IP change detection, multiple device alerts
- **Session Management**: Limit concurrent sessions to 3 per user

### Environment Security
```bash
# Required environment variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
BCRYPT_SALT_ROUNDS=12
SESSION_TIMEOUT_MINUTES=60
REFRESH_TOKEN_EXPIRY_DAYS=30
```

## 7. Frontend Auth Integration

### Router Integration
**Location**: `/frontend/src/App.tsx`

```tsx
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="customers" element={
              <ProtectedRoute requiredPermission="customers.read">
                <CustomersPage />
              </ProtectedRoute>
            } />
            {/* Other protected routes */}
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

### API Request Interceptor
**Location**: `/frontend/src/lib/apiClient.ts`

```typescript
// Automatically attach auth token to all requests
apiClient.interceptors.request.use((config) => {
  const token = authService.getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses with automatic token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await authService.refreshToken();
        return apiClient.request(error.config);
      } catch {
        authService.signOut();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

## 8. Error Handling

### Authentication Errors
- `INVALID_CREDENTIALS`: Wrong email/password
- `ACCOUNT_LOCKED`: Too many failed attempts
- `TOKEN_EXPIRED`: JWT token expired
- `INSUFFICIENT_PERMISSIONS`: Access denied
- `ORGANIZATION_INACTIVE`: Organization account suspended
- `EMAIL_NOT_VERIFIED`: Email verification required

### User-Friendly Messages
```typescript
const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Email ou senha incorretos. Tente novamente.',
  ACCOUNT_LOCKED: 'Conta temporariamente bloqueada. Tente novamente em alguns minutos.',
  TOKEN_EXPIRED: 'Sua sessão expirou. Faça login novamente.',
  INSUFFICIENT_PERMISSIONS: 'Você não tem permissão para acessar esta página.',
  ORGANIZATION_INACTIVE: 'Conta da organização inativa. Entre em contato com o suporte.',
  EMAIL_NOT_VERIFIED: 'Verifique seu email antes de continuar.'
};
```

## 9. Testing Requirements

### Authentication Flow Tests
- Login with valid credentials
- Login with invalid credentials
- Automatic token refresh
- Session timeout handling
- Permission-based route access
- Organization data isolation
- Password reset flow
- Account lockout scenarios

### Security Tests
- SQL injection attempts
- XSS prevention
- CSRF protection
- Rate limiting enforcement
- Token manipulation attempts
- Organization boundary violations

## 10. Migration Strategy

### Phase 1: Basic Authentication
1. Create missing LoginForm component
2. Implement AuthContext with Supabase integration
3. Fix ProtectedRoute component
4. Add JWT middleware to backend
5. Test login/logout flow

### Phase 2: Enhanced Security
1. Implement RBAC system
2. Add RLS policies to all tables
3. Create user management interface
4. Add session management
5. Implement account protection features

### Phase 3: Advanced Features
1. Add social login options
2. Implement 2FA (optional)
3. Add audit logging for auth events
4. Create admin user management tools
5. Add organization management features

This authentication specification provides the complete foundation needed to resurrect the Auzap system's security and user management, addressing all the critical issues identified in the audit.