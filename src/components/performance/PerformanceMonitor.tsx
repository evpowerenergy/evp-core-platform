
import { useEffect } from 'react';

interface PerformanceMonitorProps {
  componentName: string;
  enableLogging?: boolean;
  threshold?: {
    loadTime: number;
    renderTime: number;
  };
}

export const usePerformanceMonitor = ({ 
  componentName, 
  enableLogging = true,
  threshold = { loadTime: 2000, renderTime: 100 }
}: PerformanceMonitorProps) => {
  useEffect(() => {
    if (!enableLogging) return;

    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > threshold.renderTime) {
        console.warn(`🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      } else {
    
      }
    };
  }, [componentName, enableLogging, threshold.renderTime]);

  const measureAsyncOperation = async <T,>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    try {
      const result = await operation();
      const endTime = performance.now();
      const operationTime = endTime - startTime;

      if (operationTime > threshold.loadTime) {
        console.warn(`🐌 Slow operation in ${componentName}.${operationName}: ${operationTime.toFixed(2)}ms`);
      } else {
    
      }

      return result;
    } catch (error) {
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      console.error(`❌ Operation failed in ${componentName}.${operationName} after ${operationTime.toFixed(2)}ms:`, error);
      throw error;
    }
  };

  return { measureAsyncOperation };
};
