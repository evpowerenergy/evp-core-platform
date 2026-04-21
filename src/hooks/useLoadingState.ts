import { useState, useCallback, useRef, useEffect } from 'react';

interface UseLoadingStateOptions {
  initialLoading?: boolean;
  delay?: number; // Delay before showing loading (ms)
  minDuration?: number; // Minimum loading duration (ms)
}

interface UseLoadingStateReturn {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  withLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>;
  startLoading: () => void;
  stopLoading: () => void;
}

export const useLoadingState = (options: UseLoadingStateOptions = {}): UseLoadingStateReturn => {
  const {
    initialLoading = false,
    delay = 0,
    minDuration = 0
  } = options;

  const [isLoading, setIsLoading] = useState(initialLoading);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const setLoading = useCallback((loading: boolean) => {
    if (loading) {
      startTimeRef.current = Date.now();
      if (delay > 0) {
        timeoutRef.current = setTimeout(() => {
          setIsLoading(true);
        }, delay);
      } else {
        setIsLoading(true);
      }
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (startTimeRef.current && minDuration > 0) {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = minDuration - elapsed;
        
        if (remaining > 0) {
          setTimeout(() => {
            setIsLoading(false);
          }, remaining);
        } else {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }
  }, [delay, minDuration]);

  const withLoading = useCallback(async <T,>(asyncFn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const startLoading = useCallback(() => {
    setLoading(true);
  }, [setLoading]);

  const stopLoading = useCallback(() => {
    setLoading(false);
  }, [setLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    setLoading,
    withLoading,
    startLoading,
    stopLoading
  };
};

// Hook for multiple loading states
export const useMultipleLoadingStates = (keys: string[]) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    keys.reduce((acc, key) => ({ ...acc, [key]: false }), {})
  );

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  const withLoading = useCallback(async <T,>(
    key: string, 
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    setLoading(key, true);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setLoading(key, false);
    }
  }, [setLoading]);

  return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    withLoading
  };
};
