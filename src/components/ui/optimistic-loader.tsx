
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimisticLoaderProps {
  isLoading: boolean;
  isOptimistic?: boolean;
  children: React.ReactNode;
  loadingMessage?: string;
  optimisticMessage?: string;
  className?: string;
}

export const OptimisticLoader: React.FC<OptimisticLoaderProps> = ({
  isLoading,
  isOptimistic = false,
  children,
  loadingMessage = "กำลังบันทึก...",
  optimisticMessage = "บันทึกเรียบร้อย กำลังซิงค์ข้อมูล...",
  className
}) => {
  if (isLoading && !isOptimistic) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">{loadingMessage}</span>
        </div>
      </div>
    );
  }

  if (isOptimistic) {
    return (
      <div className={cn("relative", className)}>
        {children}
        <div className="absolute top-0 right-0 p-2">
          <div className="flex items-center space-x-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>ซิงค์...</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
