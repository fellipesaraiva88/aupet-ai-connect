import { useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationOptions {
  replace?: boolean;
  preventBack?: boolean;
  cleanupOnLeave?: () => void;
}

/**
 * Enhanced navigation hook that handles:
 * - Safe navigation with error boundaries
 * - Cleanup of subscriptions and state
 * - Prevention of navigation issues
 */
export const useEnhancedNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Keep track of cleanup functions
  const cleanupFunctions = new Set<() => void>();

  // Register cleanup function
  const registerCleanup = useCallback((cleanup: () => void) => {
    cleanupFunctions.add(cleanup);
    return () => cleanupFunctions.delete(cleanup);
  }, []);

  // Enhanced navigate function with cleanup
  const safeNavigate = useCallback((
    to: string,
    options: NavigationOptions = {}
  ) => {
    try {
      // Run all cleanup functions before navigation
      cleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn('Cleanup function failed:', error);
        }
      });

      // Clear cleanup functions after running them
      cleanupFunctions.clear();

      // Custom cleanup if provided
      if (options.cleanupOnLeave) {
        options.cleanupOnLeave();
      }

      // Navigate with error handling
      navigate(to, { replace: options.replace });
    } catch (error) {
      console.error('Navigation failed:', error);
      // Fallback navigation
      window.location.href = to;
    }
  }, [navigate]);

  // Handle browser back/forward button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      try {
        // Run cleanup functions when navigating via browser buttons
        cleanupFunctions.forEach(cleanup => {
          try {
            cleanup();
          } catch (error) {
            console.warn('Cleanup function failed during popstate:', error);
          }
        });
      } catch (error) {
        console.error('PopState handling failed:', error);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn('Cleanup function failed on unmount:', error);
        }
      });
      cleanupFunctions.clear();
    };
  }, []);

  return {
    navigate: safeNavigate,
    location,
    registerCleanup,
    goBack: () => {
      try {
        // Run cleanup before going back
        cleanupFunctions.forEach(cleanup => {
          try {
            cleanup();
          } catch (error) {
            console.warn('Cleanup function failed:', error);
          }
        });
        cleanupFunctions.clear();
        navigate(-1);
      } catch (error) {
        console.error('Go back failed:', error);
        // Fallback
        window.history.back();
      }
    },
    goForward: () => {
      try {
        navigate(1);
      } catch (error) {
        console.error('Go forward failed:', error);
        window.history.forward();
      }
    },
    goHome: () => safeNavigate('/'),
  };
};

export default useEnhancedNavigation;