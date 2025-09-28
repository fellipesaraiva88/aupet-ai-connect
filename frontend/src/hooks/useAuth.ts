import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Development mode bypass (desabilitado para usar autenticação real)
  const isDevelopment = false;

  // Fetch user profile data including organization
  const fetchUserProfile = async (userId: string): Promise<AuthUser | null> => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          organization_id,
          avatar_url,
          permissions,
          organizations (
            id,
            name,
            subscription_tier
          )
        `)
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return null;
      }

      if (!profile || !profile.organizations) {
        console.error('User profile or organization not found');
        return null;
      }

      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        organization_id: profile.organization_id,
        organization: {
          id: profile.organizations.id,
          name: profile.organizations.name,
          subscription_tier: profile.organizations.subscription_tier,
        },
        avatar_url: profile.avatar_url,
        permissions: profile.permissions || [],
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Development mode bypass - skip real auth in dev mode
    if (isDevelopment) {
      const mockUser = {
        id: 'dev-user-id',
        email: 'dev@auzap.com',
        full_name: 'Desenvolvedor Auzap',
        role: 'admin' as const,
        organization_id: 'dev-org-id',
        organization: {
          id: 'dev-org-id',
          name: 'Auzap Development',
          subscription_tier: 'pro',
        },
        avatar_url: null,
        permissions: ['all'],
      };

      setUserProfile(mockUser);
      setUser({ id: 'dev-user-id', email: 'dev@auzap.com' } as User);
      setSession({ user: { id: 'dev-user-id', email: 'dev@auzap.com' } } as Session);
      setLoading(false);
      return;
    }

    // Get initial session - PRODUCTION READY
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    }).catch(error => {
      console.error('Auth error:', error);
      setLoading(false);
    });

    // Listen for auth changes only in production
    if (!isDevelopment) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }

        setLoading(false);
      });

      return () => subscription.unsubscribe();
    }
  }, [isDevelopment]);

  const signIn = async (email: string, password: string, rememberMe?: boolean) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data.user && !error && rememberMe) {
      // Store in localStorage for "remember me" functionality
      localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));
    }

    return { data, error };
  };

  const signUp = async (email: string, password: string, fullName?: string, organizationName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || 'Usuário',
          organization_name: organizationName || 'Organização Padrão',
          subscription_tier: 'free'
        }
      }
    });
    return { data, error };
  };

  const signOut = async () => {
    // Clear any stored tokens
    localStorage.removeItem('supabase.auth.token');

    const { error } = await supabase.auth.signOut();

    // Clear user profile state
    setUserProfile(null);

    return { error };
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user?.id) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: updates.full_name,
        avatar_url: updates.avatar_url,
        // Don't allow updating role or organization_id through this function
      })
      .eq('id', user.id);

    if (error) throw error;

    // Refresh user profile
    const updatedProfile = await fetchUserProfile(user.id);
    setUserProfile(updatedProfile);
  };

  const hasPermission = (permission: string): boolean => {
    if (!userProfile) return false;
    return userProfile.permissions.includes(permission) || userProfile.role === 'admin';
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!userProfile) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(userProfile.role);
  };

  return {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    hasPermission,
    hasRole,
  };
}