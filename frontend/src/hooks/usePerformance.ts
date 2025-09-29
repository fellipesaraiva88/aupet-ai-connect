import { useEffect, useCallback, useRef } from 'react';
import performanceMonitor, { usePerformanceMonitoring } from '@/utils/performance';

// Hook for component performance profiling
export function useComponentPerformance(componentName: string) {
  const renderCount = useRef(0);
  const { measureCustom, startTimer } = usePerformanceMonitoring();

  useEffect(() => {
    renderCount.current += 1;
    measureCustom(`${componentName}-render-count`, renderCount.current);
  });

  const profileFunction = useCallback(<T extends any[], R>(
    fn: (...args: T) => R,
    functionName: string
  ) => {
    return (...args: T): R => {
      const endTimer = startTimer(`${componentName}-${functionName}`);
      const result = fn(...args);
      endTimer();
      return result;
    };
  }, [componentName, startTimer]);

  const profileAsyncFunction = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    functionName: string
  ) => {
    return async (...args: T): Promise<R> => {
      const endTimer = startTimer(`${componentName}-${functionName}`);
      try {
        const result = await fn(...args);
        endTimer();
        return result;
      } catch (error) {
        endTimer();
        throw error;
      }
    };
  }, [componentName, startTimer]);

  return {
    renderCount: renderCount.current,
    profileFunction,
    profileAsyncFunction,
  };
}

// Hook for lazy loading with performance tracking
export function useLazyLoadingPerformance() {
  const { measureCustom } = usePerformanceMonitoring();

  const trackLazyLoad = useCallback((componentName: string, loadTime: number) => {
    measureCustom(`lazy-load-${componentName}`, loadTime);
  }, [measureCustom]);

  const withLazyLoadTracking = useCallback(<T>(
    importFn: () => Promise<{ default: React.ComponentType<T> }>,
    componentName: string
  ) => {
    return async () => {
      const startTime = performance.now();
      try {
        const module = await importFn();
        const loadTime = performance.now() - startTime;
        trackLazyLoad(componentName, loadTime);
        return module;
      } catch (error) {
        const loadTime = performance.now() - startTime;
        measureCustom(`lazy-load-error-${componentName}`, loadTime);
        throw error;
      }
    };
  }, [trackLazyLoad, measureCustom]);

  return {
    trackLazyLoad,
    withLazyLoadTracking,
  };
}

// Hook for API performance tracking
export function useAPIPerformance() {
  const { measureCustom } = usePerformanceMonitoring();

  const trackAPICall = useCallback((endpoint: string, duration: number, status: number) => {
    measureCustom(`api-${endpoint.replace(/[^a-zA-Z0-9]/g, '-')}`, duration);
    measureCustom(`api-status-${status}`, 1);
  }, [measureCustom]);

  const wrapFetch = useCallback((
    input: RequestInfo | URL,
    init?: RequestInit
  ) => {
    const startTime = performance.now();
    const url = typeof input === 'string' ? input : input.toString();
    const endpoint = new URL(url).pathname;

    return fetch(input, init)
      .then(response => {
        const duration = performance.now() - startTime;
        trackAPICall(endpoint, duration, response.status);
        return response;
      })
      .catch(error => {
        const duration = performance.now() - startTime;
        trackAPICall(endpoint, duration, 0);
        throw error;
      });
  }, [trackAPICall]);

  return {
    trackAPICall,
    wrapFetch,
  };
}

// Hook for interaction performance
export function useInteractionPerformance() {
  const { measureCustom } = usePerformanceMonitoring();

  const trackClick = useCallback((elementName: string) => {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      measureCustom(`click-${elementName}`, duration);
    };
  }, [measureCustom]);

  const trackFormSubmission = useCallback((formName: string) => {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      measureCustom(`form-submit-${formName}`, duration);
    };
  }, [measureCustom]);

  const trackNavigation = useCallback((route: string) => {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      measureCustom(`navigation-${route}`, duration);
    };
  }, [measureCustom]);

  return {
    trackClick,
    trackFormSubmission,
    trackNavigation,
  };
}

// Hook for memory monitoring
export function useMemoryMonitoring() {
  const checkMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

      if (usagePercentage > 80) {
        console.warn('High memory usage detected:', usagePercentage.toFixed(2) + '%');
      }

      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage,
      };
    }

    return null;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkMemoryUsage();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [checkMemoryUsage]);

  return { checkMemoryUsage };
}

// Hook for bundle analysis
export function useBundleAnalysis() {
  const { measureCustom } = usePerformanceMonitoring();

  const analyzeBundlePerformance = useCallback(() => {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      const jsEntries = resourceEntries.filter(entry =>
        entry.name.includes('.js') && !entry.name.includes('chrome-extension')
      );

      const totalJSSize = jsEntries.reduce((total, entry) => total + (entry.transferSize || 0), 0);
      const totalJSLoadTime = jsEntries.reduce((total, entry) => total + entry.duration, 0);

      measureCustom('bundle-js-size', totalJSSize);
      measureCustom('bundle-js-load-time', totalJSLoadTime);

      // Identify slow-loading chunks
      jsEntries.forEach(entry => {
        if (entry.duration > 1000) { // More than 1 second
          measureCustom(`slow-chunk-${entry.name.split('/').pop()?.split('.')[0] || 'unknown'}`, entry.duration);
        }
      });

      return {
        totalJSSize,
        totalJSLoadTime,
        chunkCount: jsEntries.length,
        slowChunks: jsEntries.filter(entry => entry.duration > 1000),
      };
    }

    return null;
  }, [measureCustom]);

  return { analyzeBundlePerformance };
}