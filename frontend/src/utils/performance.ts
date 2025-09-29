// Performance monitoring utilities
export interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  domContentLoaded?: number;
  loadComplete?: number;
}

export interface CustomMetrics {
  name: string;
  value: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private customMetrics: CustomMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
    this.measureBasicMetrics();
  }

  private initializeObservers() {
    // Web Vitals Observer
    if ('PerformanceObserver' in window) {
      // First Contentful Paint & Largest Contentful Paint
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
          }
        });
      });

      try {
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      } catch (e) {
        console.warn('Paint observer not supported');
      }

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.name === 'first-input') {
            this.metrics.fid = entry.processingStart - entry.startTime;
          }
        });
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;
          }
        });
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }
  }

  private measureBasicMetrics() {
    // Time to First Byte
    if ('performance' in window && 'getEntriesByType' in performance) {
      const [navigationEntry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntry) {
        this.metrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        this.metrics.domContentLoaded = navigationEntry.domContentLoadedEventEnd - navigationEntry.navigationStart;
        this.metrics.loadComplete = navigationEntry.loadEventEnd - navigationEntry.navigationStart;
      }
    }
  }

  public measureCustom(name: string, value: number) {
    this.customMetrics.push({
      name,
      value,
      timestamp: Date.now(),
    });
  }

  public startTimer(name: string): () => void {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      this.measureCustom(name, endTime - startTime);
    };
  }

  public getMetrics(): PerformanceMetrics & { custom: CustomMetrics[] } {
    return {
      ...this.metrics,
      custom: [...this.customMetrics],
    };
  }

  public getWebVitalsScore(): { score: number; rating: 'good' | 'needs-improvement' | 'poor' } {
    const { fcp, lcp, fid, cls } = this.metrics;

    let score = 0;
    let validMetrics = 0;

    // FCP scoring (0-3 points)
    if (fcp !== undefined) {
      if (fcp <= 1800) score += 3;
      else if (fcp <= 3000) score += 2;
      else score += 1;
      validMetrics++;
    }

    // LCP scoring (0-3 points)
    if (lcp !== undefined) {
      if (lcp <= 2500) score += 3;
      else if (lcp <= 4000) score += 2;
      else score += 1;
      validMetrics++;
    }

    // FID scoring (0-3 points)
    if (fid !== undefined) {
      if (fid <= 100) score += 3;
      else if (fid <= 300) score += 2;
      else score += 1;
      validMetrics++;
    }

    // CLS scoring (0-3 points)
    if (cls !== undefined) {
      if (cls <= 0.1) score += 3;
      else if (cls <= 0.25) score += 2;
      else score += 1;
      validMetrics++;
    }

    if (validMetrics === 0) {
      return { score: 0, rating: 'poor' };
    }

    const normalizedScore = (score / (validMetrics * 3)) * 100;

    let rating: 'good' | 'needs-improvement' | 'poor';
    if (normalizedScore >= 80) rating = 'good';
    else if (normalizedScore >= 60) rating = 'needs-improvement';
    else rating = 'poor';

    return { score: normalizedScore, rating };
  }

  public reportMetrics(endpoint?: string) {
    const allMetrics = this.getMetrics();
    const vitalsScore = this.getWebVitalsScore();

    const report = {
      ...allMetrics,
      vitalsScore,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    if (endpoint) {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      }).catch(console.error);
    }

    console.log('Performance Report:', report);
    return report;
  }

  public cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;

// React hook for performance monitoring
import { useEffect, useRef } from 'react';

export function usePerformanceMonitoring() {
  const renderStartTime = useRef<number>();

  useEffect(() => {
    renderStartTime.current = performance.now();

    return () => {
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        performanceMonitor.measureCustom('component-render', renderTime);
      }
    };
  });

  const measureCustom = (name: string, value: number) => {
    performanceMonitor.measureCustom(name, value);
  };

  const startTimer = (name: string) => {
    return performanceMonitor.startTimer(name);
  };

  const getMetrics = () => {
    return performanceMonitor.getMetrics();
  };

  const reportMetrics = (endpoint?: string) => {
    return performanceMonitor.reportMetrics(endpoint);
  };

  return {
    measureCustom,
    startTimer,
    getMetrics,
    reportMetrics,
  };
}

// Bundle size monitoring
export function analyzeBundleSize() {
  if ('performance' in window && 'getEntriesByType' in performance) {
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    const jsResources = resourceEntries.filter(entry =>
      entry.name.includes('.js') && !entry.name.includes('chrome-extension')
    );

    const cssResources = resourceEntries.filter(entry =>
      entry.name.includes('.css')
    );

    const totalJSSize = jsResources.reduce((total, entry) => total + (entry.transferSize || 0), 0);
    const totalCSSSize = cssResources.reduce((total, entry) => total + (entry.transferSize || 0), 0);

    return {
      js: {
        count: jsResources.length,
        totalSize: totalJSSize,
        averageSize: totalJSSize / jsResources.length,
        resources: jsResources.map(entry => ({
          url: entry.name,
          size: entry.transferSize,
          duration: entry.duration,
        })),
      },
      css: {
        count: cssResources.length,
        totalSize: totalCSSSize,
        averageSize: totalCSSSize / cssResources.length,
        resources: cssResources.map(entry => ({
          url: entry.name,
          size: entry.transferSize,
          duration: entry.duration,
        })),
      },
      total: totalJSSize + totalCSSSize,
    };
  }

  return null;
}

// Memory usage monitoring
export function getMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }

  return null;
}

// Connection monitoring
export function getConnectionInfo() {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }

  return null;
}