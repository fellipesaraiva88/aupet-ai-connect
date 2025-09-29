import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  // State
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, userData?: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        user: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        // Actions
        setUser: (user) => {
          set((state) => {
            state.user = user;
            state.isLoading = false;
            state.error = null;
          });
        },

        setLoading: (loading) => {
          set((state) => {
            state.isLoading = loading;
          });
        },

        setError: (error) => {
          set((state) => {
            state.error = error;
            state.isLoading = false;
          });
        },

        login: async (email, password) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (error) throw error;

            set((state) => {
              state.user = data.user;
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Login failed';
              state.isLoading = false;
            });
            throw error;
          }
        },

        signup: async (email, password, userData) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: userData,
              },
            });

            if (error) throw error;

            set((state) => {
              state.user = data.user;
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Signup failed';
              state.isLoading = false;
            });
            throw error;
          }
        },

        logout: async () => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            set((state) => {
              state.user = null;
              state.isLoading = false;
              state.error = null;
            });

            // Clear other stores if needed
            // useUIStore.getState().reset();
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Logout failed';
              state.isLoading = false;
            });
            throw error;
          }
        },

        refreshAuth: async () => {
          try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) throw error;

            set((state) => {
              state.user = session?.user || null;
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Auth refresh failed';
              state.isLoading = false;
            });
          }
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        initialize: async () => {
          if (get().isInitialized) return;

          set((state) => {
            state.isLoading = true;
          });

          try {
            // Get initial session
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) throw error;

            set((state) => {
              state.user = session?.user || null;
              state.isInitialized = true;
              state.isLoading = false;
            });

            // Set up auth listener
            supabase.auth.onAuthStateChange((event, session) => {
              set((state) => {
                state.user = session?.user || null;
                if (event === 'SIGNED_OUT') {
                  state.error = null;
                }
              });
            });
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Auth initialization failed';
              state.isInitialized = true;
              state.isLoading = false;
            });
          }
        },
      })),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          isInitialized: state.isInitialized
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// Computed selectors
export const useAuth = () => {
  const store = useAuthStore();

  return {
    user: store.user,
    isLoading: store.isLoading,
    error: store.error,
    isInitialized: store.isInitialized,
    isAuthenticated: !!store.user,
    login: store.login,
    signup: store.signup,
    logout: store.logout,
    refreshAuth: store.refreshAuth,
    clearError: store.clearError,
    initialize: store.initialize,
  };
};

// Organization helper
export const useOrganizationId = () => {
  const { user } = useAuth();
  return user?.user_metadata?.organization_id || '00000000-0000-0000-0000-000000000001';
};