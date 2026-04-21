import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
  networkRequests: number;
  errors: number;
}

interface PerformanceConfig {
  enableLogging?: boolean;
  enableMemoryTracking?: boolean;
  enableNetworkTracking?: boolean;
  threshold?: {
    loadTime?: number;
    renderTime?: number;
    memoryUsage?: number;
  };
}

export const usePerformanceMonitor = (
  componentName: string,
  config: PerformanceConfig = {}
) => {
  const {
    enableLogging = true,
    enableMemoryTracking = false,
    enableNetworkTracking = false,
    threshold = {}
  } = config;

  const startTime = useRef<number>(Date.now());
  const renderStartTime = useRef<number>(0);
  const metrics = useRef<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkRequests: 0,
    errors: 0
  });

  // Track render performance
  const trackRender = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRender = useCallback(() => {
    if (renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      metrics.current.renderTime = renderTime;
      
      if (enableLogging && threshold.renderTime && renderTime > threshold.renderTime) {
        console.warn(`[Performance] ${componentName} render time (${renderTime.toFixed(2)}ms) exceeds threshold (${threshold.renderTime}ms)`);
      }
    }
  }, [componentName, enableLogging, threshold.renderTime]);

  // Track memory usage
  const trackMemory = useCallback(() => {
    if (enableMemoryTracking && 'memory' in performance) {
      const memory = (performance as any).memory;
      metrics.current.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
      
      if (enableLogging && threshold.memoryUsage && metrics.current.memoryUsage > threshold.memoryUsage) {
        console.warn(`[Performance] ${componentName} memory usage (${metrics.current.memoryUsage.toFixed(2)}MB) exceeds threshold (${threshold.memoryUsage}MB)`);
      }
    }
  }, [componentName, enableMemoryTracking, enableLogging, threshold.memoryUsage]);

  // Track network requests
  const trackNetworkRequest = useCallback(() => {
    if (enableNetworkTracking) {
      metrics.current.networkRequests++;
    }
  }, [enableNetworkTracking]);

  // Track errors
  const trackError = useCallback((error: Error) => {
    metrics.current.errors++;
    if (enableLogging) {
      console.error(`[Performance] ${componentName} error:`, error);
    }
  }, [componentName, enableLogging]);

  // Get current metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    const loadTime = Date.now() - startTime.current;
    return {
      ...metrics.current,
      loadTime
    };
  }, []);

  // Log performance summary
  const logPerformanceSummary = useCallback(() => {
    if (!enableLogging) return;

    const finalMetrics = getMetrics();
    const summary = {
      component: componentName,
      loadTime: `${finalMetrics.loadTime}ms`,
      renderTime: `${finalMetrics.renderTime.toFixed(2)}ms`,
      networkRequests: finalMetrics.networkRequests,
      errors: finalMetrics.errors,
      ...(finalMetrics.memoryUsage && { memoryUsage: `${finalMetrics.memoryUsage.toFixed(2)}MB` })
    };

    

    // Check for performance issues
    const issues = [];
    if (threshold.loadTime && finalMetrics.loadTime > threshold.loadTime) {
      issues.push(`Load time (${finalMetrics.loadTime}ms) exceeds threshold (${threshold.loadTime}ms)`);
    }
    if (threshold.renderTime && finalMetrics.renderTime > threshold.renderTime) {
      issues.push(`Render time (${finalMetrics.renderTime.toFixed(2)}ms) exceeds threshold (${threshold.renderTime}ms)`);
    }
    if (threshold.memoryUsage && finalMetrics.memoryUsage && finalMetrics.memoryUsage > threshold.memoryUsage) {
      issues.push(`Memory usage (${finalMetrics.memoryUsage.toFixed(2)}MB) exceeds threshold (${threshold.memoryUsage}MB)`);
    }

    if (issues.length > 0) {
      console.warn(`[Performance Issues] ${componentName}:`, issues);
    }
  }, [componentName, enableLogging, threshold, getMetrics]);

  // Track component lifecycle
  useEffect(() => {
    trackRender();
    
    return () => {
      endRender();
      trackMemory();
      logPerformanceSummary();
    };
  }, [trackRender, endRender, trackMemory, logPerformanceSummary]);

  // Track render cycles
  useEffect(() => {
    endRender();
    trackRender();
  });

  return {
    trackRender,
    endRender,
    trackMemory,
    trackNetworkRequest,
    trackError,
    getMetrics,
    logPerformanceSummary
  };
};

// Hook สำหรับ track query performance
export const useQueryPerformanceMonitor = (queryKey: string) => {
  const startTime = useRef<number>(Date.now());
  const queryStartTime = useRef<number>(0);

  const startQuery = useCallback(() => {
    queryStartTime.current = performance.now();
  }, []);

  const endQuery = useCallback((success: boolean = true) => {
    if (queryStartTime.current > 0) {
      const queryTime = performance.now() - queryStartTime.current;
      const totalTime = Date.now() - startTime.current;
      


      // Warn if query takes too long
      if (queryTime > 1000) {
        console.warn(`[Query Performance] ${queryKey} took ${queryTime.toFixed(2)}ms to complete`);
      }
    }
  }, [queryKey]);

  return { startQuery, endQuery };
};

// Hook สำหรับ track component re-renders
export const useRenderTracker = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef<number>(0);

  useEffect(() => {
    renderCount.current++;
    const now = performance.now();
    
    if (lastRenderTime.current > 0) {
      const timeSinceLastRender = now - lastRenderTime.current;

    }
    
    lastRenderTime.current = now;
  });

  return renderCount.current;
}; 