import { useState, useCallback } from 'react';
import { EnhancedToastProps, ToastType } from '@/components/ui/enhanced-toast';

let toastCounter = 0;

interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastMethods {
  success: (title: string, description?: string, options?: ToastOptions) => string;
  error: (title: string, description?: string, options?: ToastOptions) => string;
  warning: (title: string, description?: string, options?: ToastOptions) => string;
  info: (title: string, description?: string, options?: ToastOptions) => string;
  loading: (title: string, description?: string, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  update: (id: string, updates: Partial<Pick<EnhancedToastProps, 'title' | 'description' | 'type'>>) => void;
}

export const useEnhancedToast = () => {
  const [toasts, setToasts] = useState<EnhancedToastProps[]>([]);

  const addToast = useCallback((
    type: ToastType,
    title: string,
    description?: string,
    options?: ToastOptions
  ): string => {
    const id = `toast-${++toastCounter}`;
    const duration = options?.duration ?? (type === 'loading' ? 0 : 5000);

    const newToast: EnhancedToastProps = {
      id,
      type,
      title,
      description,
      duration,
      action: options?.action,
      onDismiss: (toastId: string) => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      }
    };

    setToasts(prev => [...prev, newToast]);

    // Auto dismiss if duration is set
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const update = useCallback((
    id: string,
    updates: Partial<Pick<EnhancedToastProps, 'title' | 'description' | 'type'>>
  ) => {
    setToasts(prev => prev.map(toast =>
      toast.id === id ? { ...toast, ...updates } : toast
    ));
  }, []);

  const toast: ToastMethods = {
    success: (title, description, options) => addToast('success', title, description, options),
    error: (title, description, options) => addToast('error', title, description, options),
    warning: (title, description, options) => addToast('warning', title, description, options),
    info: (title, description, options) => addToast('info', title, description, options),
    loading: (title, description, options) => addToast('loading', title, description, options),
    dismiss,
    dismissAll,
    update
  };

  return {
    toasts,
    toast
  };
};

// Singleton instance for global use
let globalToastInstance: ReturnType<typeof useEnhancedToast> | null = null;

export const useGlobalToast = () => {
  if (!globalToastInstance) {
    // Fallback: return a no-op toast to prevent crashes
    console.warn('Global toast instance not initialized. Using fallback.');
    return {
      success: () => '',
      error: () => '',
      warning: () => '',
      info: () => '',
      loading: () => '',
      dismiss: () => {},
      dismissAll: () => {},
      update: () => {}
    };
  }
  return globalToastInstance.toast;
};

export const setGlobalToastInstance = (instance: ReturnType<typeof useEnhancedToast>) => {
  globalToastInstance = instance;
};