import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

type LoadingKey = 'navigation' | 'auth' | 'data' | 'upload' | 'submit';
type Theme = 'light' | 'dark' | 'system';

interface UIState {
  // Loading states
  loadingStates: Record<LoadingKey, boolean>;

  // Theme
  theme: Theme;

  // Sidebar
  sidebarCollapsed: boolean;

  // Modals
  openModals: Set<string>;

  // Notifications
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message?: string;
    duration?: number;
    timestamp: number;
  }>;

  // Search
  globalSearchQuery: string;
  isSearchOpen: boolean;

  // Navigation
  activeNavItem: string;
  breadcrumbs: Array<{ label: string; href?: string }>;

  // Actions
  setLoading: (key: LoadingKey, loading: boolean) => void;
  isAnyLoading: () => boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  isModalOpen: (id: string) => boolean;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setGlobalSearch: (query: string) => void;
  toggleSearch: () => void;
  setActiveNavItem: (item: string) => void;
  setBreadcrumbs: (breadcrumbs: UIState['breadcrumbs']) => void;
  reset: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        loadingStates: {
          navigation: false,
          auth: false,
          data: false,
          upload: false,
          submit: false,
        },
        theme: 'system',
        sidebarCollapsed: false,
        openModals: new Set(),
        notifications: [],
        globalSearchQuery: '',
        isSearchOpen: false,
        activeNavItem: 'dashboard',
        breadcrumbs: [{ label: 'Dashboard' }],

        // Actions
        setLoading: (key, loading) => {
          set((state) => {
            state.loadingStates[key] = loading;
          });
        },

        isAnyLoading: () => {
          const state = get();
          return Object.values(state.loadingStates).some(Boolean);
        },

        setTheme: (theme) => {
          set((state) => {
            state.theme = theme;
          });
        },

        toggleSidebar: () => {
          set((state) => {
            state.sidebarCollapsed = !state.sidebarCollapsed;
          });
        },

        setSidebarCollapsed: (collapsed) => {
          set((state) => {
            state.sidebarCollapsed = collapsed;
          });
        },

        openModal: (id) => {
          set((state) => {
            state.openModals.add(id);
          });
        },

        closeModal: (id) => {
          set((state) => {
            state.openModals.delete(id);
          });
        },

        isModalOpen: (id) => {
          return get().openModals.has(id);
        },

        addNotification: (notification) => {
          const id = Math.random().toString(36).substr(2, 9);
          const timestamp = Date.now();

          set((state) => {
            state.notifications.push({
              ...notification,
              id,
              timestamp,
            });

            // Keep only last 10 notifications
            if (state.notifications.length > 10) {
              state.notifications = state.notifications.slice(-10);
            }
          });

          // Auto-remove notification after duration
          if (notification.duration !== 0) {
            const duration = notification.duration || 5000;
            setTimeout(() => {
              get().removeNotification(id);
            }, duration);
          }
        },

        removeNotification: (id) => {
          set((state) => {
            state.notifications = state.notifications.filter(n => n.id !== id);
          });
        },

        clearNotifications: () => {
          set((state) => {
            state.notifications = [];
          });
        },

        setGlobalSearch: (query) => {
          set((state) => {
            state.globalSearchQuery = query;
          });
        },

        toggleSearch: () => {
          set((state) => {
            state.isSearchOpen = !state.isSearchOpen;
          });
        },

        setActiveNavItem: (item) => {
          set((state) => {
            state.activeNavItem = item;
          });
        },

        setBreadcrumbs: (breadcrumbs) => {
          set((state) => {
            state.breadcrumbs = breadcrumbs;
          });
        },

        reset: () => {
          set((state) => {
            // Reset to initial state but keep theme and sidebar preferences
            const { theme, sidebarCollapsed } = state;
            Object.assign(state, {
              loadingStates: {
                navigation: false,
                auth: false,
                data: false,
                upload: false,
                submit: false,
              },
              theme,
              sidebarCollapsed,
              openModals: new Set(),
              notifications: [],
              globalSearchQuery: '',
              isSearchOpen: false,
              activeNavItem: 'dashboard',
              breadcrumbs: [{ label: 'Dashboard' }],
            });
          });
        },
      })),
      {
        name: 'ui-store',
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

// Convenient hooks
export const useLoading = () => {
  const setLoading = useUIStore((state) => state.setLoading);
  const isAnyLoading = useUIStore((state) => state.isAnyLoading);
  const loadingStates = useUIStore((state) => state.loadingStates);

  return {
    setLoading,
    isAnyLoading,
    loadingStates,
    isLoading: (key: LoadingKey) => loadingStates[key],
  };
};

export const useTheme = () => {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  return { theme, setTheme };
};

export const useSidebar = () => {
  const collapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggle = useUIStore((state) => state.toggleSidebar);
  const setCollapsed = useUIStore((state) => state.setSidebarCollapsed);

  return { collapsed, toggle, setCollapsed };
};

export const useModals = () => {
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const isModalOpen = useUIStore((state) => state.isModalOpen);

  return { openModal, closeModal, isModalOpen };
};

export const useNotifications = () => {
  const notifications = useUIStore((state) => state.notifications);
  const addNotification = useUIStore((state) => state.addNotification);
  const removeNotification = useUIStore((state) => state.removeNotification);
  const clearNotifications = useUIStore((state) => state.clearNotifications);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    success: (title: string, message?: string, duration?: number) =>
      addNotification({ type: 'success', title, message, duration }),
    error: (title: string, message?: string, duration?: number) =>
      addNotification({ type: 'error', title, message, duration }),
    info: (title: string, message?: string, duration?: number) =>
      addNotification({ type: 'info', title, message, duration }),
    warning: (title: string, message?: string, duration?: number) =>
      addNotification({ type: 'warning', title, message, duration }),
  };
};

export const useSearch = () => {
  const query = useUIStore((state) => state.globalSearchQuery);
  const isOpen = useUIStore((state) => state.isSearchOpen);
  const setQuery = useUIStore((state) => state.setGlobalSearch);
  const toggle = useUIStore((state) => state.toggleSearch);

  return { query, isOpen, setQuery, toggle };
};

export const useNavigation = () => {
  const activeNavItem = useUIStore((state) => state.activeNavItem);
  const breadcrumbs = useUIStore((state) => state.breadcrumbs);
  const setActiveNavItem = useUIStore((state) => state.setActiveNavItem);
  const setBreadcrumbs = useUIStore((state) => state.setBreadcrumbs);

  return {
    activeNavItem,
    breadcrumbs,
    setActiveNavItem,
    setBreadcrumbs,
  };
};