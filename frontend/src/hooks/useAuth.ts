import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for dev mode first
    const checkDevAuth = () => {
      const devUser = localStorage.getItem('auzap_dev_user');
      const devToken = localStorage.getItem('auzap_dev_token');

      if (devUser && devToken && import.meta.env.DEV) {
        try {
          const mockUser = JSON.parse(devUser);
          // Create a mock user object compatible with Supabase User type
          const supabaseUser: User = {
            id: mockUser.id,
            email: mockUser.email,
            app_metadata: {},
            user_metadata: { name: mockUser.name, role: mockUser.role },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          } as User;

          setUser(supabaseUser);
          setSession({
            access_token: devToken,
            refresh_token: devToken,
            expires_in: 86400,
            expires_at: Date.now() + 86400000,
            token_type: 'bearer',
            user: supabaseUser
          } as Session);
          setLoading(false);
          return true;
        } catch (error) {
          console.error('Dev auth error:', error);
          localStorage.removeItem('auzap_dev_user');
          localStorage.removeItem('auzap_dev_token');
        }
      }
      return false;
    };

    // Try dev auth first
    if (!checkDevAuth()) {
      // Fallback to Supabase auth
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }).catch((error) => {
        console.error('Supabase auth error:', error);
        setLoading(false);
      });

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        // Only update if not in dev mode
        const hasDevAuth = localStorage.getItem('auzap_dev_user') && import.meta.env.DEV;
        if (!hasDevAuth) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
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
    // Clear dev mode if active
    if (import.meta.env.DEV) {
      localStorage.removeItem('auzap_dev_user');
      localStorage.removeItem('auzap_dev_token');
      setUser(null);
      setSession(null);
    }

    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };
}