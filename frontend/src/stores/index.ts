// Store exports
export * from './authStore';
export * from './uiStore';
export * from './dataStore';

// Initialize stores utility
export const initializeStores = async () => {
  // Initialize auth store
  const { initialize } = await import('./authStore');
  await initialize();

  // Set up initial UI state
  const { useUIStore } = await import('./uiStore');
  const { setActiveNavItem } = useUIStore.getState();

  // Determine active nav item from current path
  const path = window.location.pathname;
  const pathMap: Record<string, string> = {
    '/': 'dashboard',
    '/conversations': 'conversations',
    '/ai-config': 'ai-config',
    '/customers': 'customers',
    '/pets': 'pets',
    '/clients-pets': 'clients-pets',
    '/appointments': 'appointments',
    '/catalog': 'catalog',
    '/analytics': 'analytics',
    '/settings': 'settings',
  };

  const activeItem = pathMap[path] || 'dashboard';
  setActiveNavItem(activeItem);
};

// Reset all stores utility
export const resetAllStores = () => {
  // Import stores dynamically to avoid circular dependencies
  import('./authStore').then(({ useAuthStore }) => {
    // Don't reset auth store automatically - let user logout
  });

  import('./uiStore').then(({ useUIStore }) => {
    useUIStore.getState().reset();
  });

  import('./dataStore').then(({ useDataStore }) => {
    useDataStore.getState().reset();
  });
};