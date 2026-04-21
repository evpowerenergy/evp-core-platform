import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoadingContextType {
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  pageLoading: boolean;
  setPageLoading: (loading: boolean) => void;
  withGlobalLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>;
  withPageLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  const withGlobalLoading = useCallback(async <T,>(asyncFn: () => Promise<T>): Promise<T> => {
    setGlobalLoading(true);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setGlobalLoading(false);
    }
  }, []);

  const withPageLoading = useCallback(async <T,>(asyncFn: () => Promise<T>): Promise<T> => {
    setPageLoading(true);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setPageLoading(false);
    }
  }, []);

  const value: LoadingContextType = {
    globalLoading,
    setGlobalLoading,
    pageLoading,
    setPageLoading,
    withGlobalLoading,
    withPageLoading
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoadingContext = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  return context;
};
