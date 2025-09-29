// Error Boundary Components
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as AsyncErrorBoundary } from './AsyncErrorBoundary';
export { default as ChunkErrorBoundary } from './ChunkErrorBoundary';

// HOC and Decorators
export {
  default as withErrorBoundary,
  withPageErrorBoundary,
  withComponentErrorBoundary,
  withAsyncErrorBoundary,
  withChunkErrorBoundary,
  withAllErrorBoundaries,
} from './withErrorBoundary';

// Global error handler setup
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);

    // Prevent default browser behavior
    event.preventDefault();

    // Log to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(event.reason);
    }
  });

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('Global JavaScript error:', event.error);

    // Log to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(event.error);
    }
  });

  // Handle chunk loading errors specifically
  window.addEventListener('error', (event) => {
    if (event.filename && event.filename.includes('chunks/')) {
      console.warn('Chunk loading error detected, attempting reload...');

      // Clear any cached chunks
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }

      // Reload after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  });
};

// Error reporting utilities
export const reportError = (error: Error, context?: Record<string, any>) => {
  const errorReport = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    context,
  };

  if (process.env.NODE_ENV === 'production') {
    // Send to error reporting service
    console.error('Error reported:', errorReport);
  } else {
    console.error('Development error:', errorReport);
  }
};

// Hook for error handling in functional components
export const useErrorHandler = () => {
  return (error: Error, context?: Record<string, any>) => {
    reportError(error, context);
  };
};