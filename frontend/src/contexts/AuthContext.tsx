import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { User, Session, AuthError, AuthResponse } from '@supabase/supabase-js';

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
  user: User | null;
  userProfile: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ data: AuthResponse['data']; error: AuthError | null }>;
  signUp: (email: string, password: string, fullName?: string, organizationName?: string) => Promise<{ data: AuthResponse['data']; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ data: AuthResponse['data']; error: AuthError | null }>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}