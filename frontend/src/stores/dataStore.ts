import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface DashboardStats {
  conversations_today: number;
  daily_appointments: number;
  response_rate_percent: number;
  daily_revenue: number;
  avg_response_time: number;
  active_conversations: number;
  pending_messages: number;
  ai_accuracy: number;
}

interface WhatsAppInstance {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  phone?: string;
  qr_code?: string;
  last_seen?: string;
  organization_id: string;
}

interface DataState {
  // Cache
  dashboardStats: Record<string, DashboardStats>;
  whatsappInstances: Record<string, WhatsAppInstance[]>;

  // Real-time data
  activeConversations: number;
  pendingMessages: number;

  // Optimistic updates
  optimisticUpdates: Record<string, any>;

  // Actions
  setDashboardStats: (orgId: string, stats: DashboardStats) => void;
  updateDashboardStat: (orgId: string, key: keyof DashboardStats, value: number) => void;
  setWhatsAppInstances: (orgId: string, instances: WhatsAppInstance[]) => void;
  updateWhatsAppInstance: (orgId: string, instanceId: string, updates: Partial<WhatsAppInstance>) => void;
  setActiveConversations: (count: number) => void;
  setPendingMessages: (count: number) => void;
  addOptimisticUpdate: (key: string, data: any) => void;
  removeOptimisticUpdate: (key: string) => void;
  clearOptimisticUpdates: () => void;
  invalidateCache: (pattern?: string) => void;
  reset: () => void;
}

export const useDataStore = create<DataState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      dashboardStats: {},
      whatsappInstances: {},
      activeConversations: 0,
      pendingMessages: 0,
      optimisticUpdates: {},

      // Actions
      setDashboardStats: (orgId, stats) => {
        set((state) => {
          state.dashboardStats[orgId] = stats;
        });
      },

      updateDashboardStat: (orgId, key, value) => {
        set((state) => {
          if (!state.dashboardStats[orgId]) {
            state.dashboardStats[orgId] = {
              conversations_today: 0,
              daily_appointments: 0,
              response_rate_percent: 0,
              daily_revenue: 0,
              avg_response_time: 0,
              active_conversations: 0,
              pending_messages: 0,
              ai_accuracy: 0,
            };
          }
          state.dashboardStats[orgId][key] = value;
        });
      },

      setWhatsAppInstances: (orgId, instances) => {
        set((state) => {
          state.whatsappInstances[orgId] = instances;
        });
      },

      updateWhatsAppInstance: (orgId, instanceId, updates) => {
        set((state) => {
          if (!state.whatsappInstances[orgId]) return;

          const instances = state.whatsappInstances[orgId];
          const index = instances.findIndex(inst => inst.id === instanceId);

          if (index !== -1) {
            Object.assign(instances[index], updates);
          }
        });
      },

      setActiveConversations: (count) => {
        set((state) => {
          state.activeConversations = count;
        });
      },

      setPendingMessages: (count) => {
        set((state) => {
          state.pendingMessages = count;
        });
      },

      addOptimisticUpdate: (key, data) => {
        set((state) => {
          state.optimisticUpdates[key] = data;
        });
      },

      removeOptimisticUpdate: (key) => {
        set((state) => {
          delete state.optimisticUpdates[key];
        });
      },

      clearOptimisticUpdates: () => {
        set((state) => {
          state.optimisticUpdates = {};
        });
      },

      invalidateCache: (pattern) => {
        set((state) => {
          if (!pattern) {
            // Clear all cache
            state.dashboardStats = {};
            state.whatsappInstances = {};
          } else if (pattern === 'dashboard') {
            state.dashboardStats = {};
          } else if (pattern === 'whatsapp') {
            state.whatsappInstances = {};
          } else if (pattern.startsWith('dashboard-')) {
            const orgId = pattern.replace('dashboard-', '');
            delete state.dashboardStats[orgId];
          } else if (pattern.startsWith('whatsapp-')) {
            const orgId = pattern.replace('whatsapp-', '');
            delete state.whatsappInstances[orgId];
          }
        });
      },

      reset: () => {
        set((state) => {
          state.dashboardStats = {};
          state.whatsappInstances = {};
          state.activeConversations = 0;
          state.pendingMessages = 0;
          state.optimisticUpdates = {};
        });
      },
    })),
    { name: 'DataStore' }
  )
);

// Convenient hooks
export const useDashboardData = (orgId: string) => {
  const stats = useDataStore((state) => state.dashboardStats[orgId]);
  const setStats = useDataStore((state) => state.setDashboardStats);
  const updateStat = useDataStore((state) => state.updateDashboardStat);

  return {
    stats,
    setStats: (stats: DashboardStats) => setStats(orgId, stats),
    updateStat: (key: keyof DashboardStats, value: number) => updateStat(orgId, key, value),
  };
};

export const useWhatsAppData = (orgId: string) => {
  const instances = useDataStore((state) => state.whatsappInstances[orgId] || []);
  const setInstances = useDataStore((state) => state.setWhatsAppInstances);
  const updateInstance = useDataStore((state) => state.updateWhatsAppInstance);

  return {
    instances,
    setInstances: (instances: WhatsAppInstance[]) => setInstances(orgId, instances),
    updateInstance: (instanceId: string, updates: Partial<WhatsAppInstance>) =>
      updateInstance(orgId, instanceId, updates),
  };
};

export const useRealTimeData = () => {
  const activeConversations = useDataStore((state) => state.activeConversations);
  const pendingMessages = useDataStore((state) => state.pendingMessages);
  const setActiveConversations = useDataStore((state) => state.setActiveConversations);
  const setPendingMessages = useDataStore((state) => state.setPendingMessages);

  return {
    activeConversations,
    pendingMessages,
    setActiveConversations,
    setPendingMessages,
  };
};

export const useOptimisticUpdates = () => {
  const updates = useDataStore((state) => state.optimisticUpdates);
  const addUpdate = useDataStore((state) => state.addOptimisticUpdate);
  const removeUpdate = useDataStore((state) => state.removeOptimisticUpdate);
  const clearUpdates = useDataStore((state) => state.clearOptimisticUpdates);

  return {
    updates,
    addUpdate,
    removeUpdate,
    clearUpdates,
    getUpdate: (key: string) => updates[key],
    hasUpdate: (key: string) => key in updates,
  };
};