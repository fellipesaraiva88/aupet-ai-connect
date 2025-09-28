import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Mock functions for common use cases
export const mockApiResponse = <T>(data: T, options?: { delay?: number; error?: boolean }) => {
  if (options?.error) {
    return Promise.reject(new Error('API Error'));
  }

  const response = {
    success: true,
    data,
    message: 'Success',
    timestamp: new Date().toISOString(),
  };

  if (options?.delay) {
    return new Promise(resolve => setTimeout(() => resolve(response), options.delay));
  }

  return Promise.resolve(response);
};

// Mock useOrganizationId hook
export const mockUseOrganizationId = () => 'test-org-id';

// Mock authentication context
export const mockAuthContext = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      organization_id: 'test-org-id',
    },
  },
  userProfile: {
    id: 'test-user-id',
    organization_id: 'test-org-id',
    name: 'Test User',
  },
  isLoading: false,
  signOut: vi.fn(),
  signIn: vi.fn(),
};

// Mock useActiveNavigation hook
export const mockUseActiveNavigation = () => 'catalog';

// Common test data
export const mockCatalogItem = {
  id: '1',
  name: 'Test Item',
  description: 'Test Description',
  category: 'Test Category',
  price: 50.0,
  duration_minutes: 30,
  requires_appointment: false,
  tags: ['test'],
  image_url: '',
  is_active: true,
  organization_id: 'test-org-id',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  type: 'service' as const,
  popular: false,
  status: 'active' as const,
};

export const mockCatalogStats = {
  total_items: 5,
  active_items: 4,
  inactive_items: 1,
  categories_count: 2,
  average_price: 75.5,
  appointment_required_items: 2,
  price_range: {
    min: 25.0,
    max: 150.0,
  },
};

// Helper to wait for loading states
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 100));
};

// Helper to create mock event
export const createMockEvent = (value: string) => ({
  target: { value },
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
});

// Helper to mock window.location
export const mockLocation = (url: string) => {
  delete (window as any).location;
  window.location = new URL(url) as any;
};