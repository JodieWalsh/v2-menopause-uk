import { useEffect } from 'react';

interface PerformanceMetrics {
  navigationTiming?: PerformanceNavigationTiming;
  resourceTiming?: PerformanceResourceTiming[];
  paintTiming?: PerformanceEntry[];
}

export const usePerformanceMonitor = (enabled: boolean = false) => {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    const observeCLS = () => {
      let clsScore = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as any;
          if (!layoutShift.hadRecentInput) {
            clsScore += layoutShift.value;
          }
        }
        if (clsScore > 0.1) {
          console.warn('Poor CLS detected:', clsScore);
        }
      }).observe({ type: 'layout-shift', buffered: true });
    };

    const observeLCP = () => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcpTime = lastEntry.startTime;
        
        if (lcpTime > 2500) {
          console.warn('Poor LCP detected:', lcpTime);
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    };

    const observeFID = () => {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const firstInput = entry as any;
          const fidTime = firstInput.processingStart - firstInput.startTime;
          
          if (fidTime > 100) {
            console.warn('Poor FID detected:', fidTime);
          }
        }
      }).observe({ type: 'first-input', buffered: true });
    };

    // Monitor resource loading performance
    const observeResources = () => {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          const loadTime = resource.responseEnd - resource.startTime;
          
          // Log slow resources (> 1000ms)
          if (loadTime > 1000) {
            console.warn('Slow resource detected:', {
              name: resource.name,
              loadTime,
              type: resource.initiatorType
            });
          }
        }
      }).observe({ type: 'resource', buffered: true });
    };

    // Monitor navigation timing
    const logNavigationTiming = () => {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          const timing = {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            request: navigation.responseStart - navigation.requestStart,
            response: navigation.responseEnd - navigation.responseStart,
            dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            load: navigation.loadEventEnd - navigation.loadEventStart
          };

          console.log('Navigation timing:', timing);
          
          // Log warnings for slow metrics
          if (timing.load > 3000) {
            console.warn('Slow page load detected:', timing.load);
          }
        }, 0);
      });
    };

    // Start monitoring
    try {
      observeCLS();
      observeLCP();
      observeFID();
      observeResources();
      logNavigationTiming();
    } catch (error) {
      console.warn('Performance monitoring failed to initialize:', error);
    }
  }, [enabled]);
};

// Hook for measuring component render performance
export const useRenderPerformance = (componentName: string, enabled: boolean = false) => {
  useEffect(() => {
    if (!enabled) return;

    const markStart = `${componentName}-render-start`;
    const markEnd = `${componentName}-render-end`;
    const measureName = `${componentName}-render-time`;

    performance.mark(markStart);

    return () => {
      performance.mark(markEnd);
      performance.measure(measureName, markStart, markEnd);
      
      const measure = performance.getEntriesByName(measureName)[0];
      if (measure.duration > 16) { // More than 1 frame (16ms at 60fps)
        console.warn(`Slow render detected for ${componentName}:`, measure.duration);
      }
      
      // Clean up marks and measures
      performance.clearMarks(markStart);
      performance.clearMarks(markEnd);
      performance.clearMeasures(measureName);
    };
  });
};

export default usePerformanceMonitor;