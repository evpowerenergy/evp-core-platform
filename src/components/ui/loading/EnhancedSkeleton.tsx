import React from 'react';
import { cn } from '@/lib/utils';
import LottieLoading from './LottieLoading';

interface EnhancedSkeletonProps {
  className?: string;
  children?: React.ReactNode;
  showLottie?: boolean;
  lottieSize?: 'sm' | 'md' | 'lg' | 'xl';
  lottieText?: string;
}

const EnhancedSkeleton: React.FC<EnhancedSkeletonProps> = ({ 
  className, 
  children, 
  showLottie = false,
  lottieSize = 'sm',
  lottieText
}) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 relative overflow-hidden',
        className
      )}
    >
      {children}
      {showLottie && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <LottieLoading 
            size={lottieSize} 
            text={lottieText}
          />
        </div>
      )}
    </div>
  );
};

// Enhanced Pre-built skeleton components
export const EnhancedSkeletonCard: React.FC<{ 
  className?: string;
  showLottie?: boolean;
  lottieText?: string;
}> = ({ className, showLottie = false, lottieText = "กำลังโหลด..." }) => (
  <div className={cn('bg-white rounded-lg border p-4 relative', className)}>
    <EnhancedSkeleton className="h-4 w-3/4 mb-2" showLottie={showLottie} lottieSize="sm" />
    <EnhancedSkeleton className="h-8 w-1/2 mb-2" showLottie={showLottie} lottieSize="sm" />
    <EnhancedSkeleton className="h-3 w-1/3" showLottie={showLottie} lottieSize="sm" />
    {showLottie && (
      <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg">
        <LottieLoading size="md" text={lottieText} />
      </div>
    )}
  </div>
);

export const EnhancedSkeletonTable: React.FC<{ 
  rows?: number; 
  columns?: number;
  showLottie?: boolean;
  lottieText?: string;
}> = ({ 
  rows = 5, 
  columns = 4,
  showLottie = false,
  lottieText = "กำลังโหลดตาราง..."
}) => (
  <div className="space-y-2 relative">
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <EnhancedSkeleton key={i} className="h-4 w-full" showLottie={showLottie} lottieSize="sm" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <EnhancedSkeleton key={colIndex} className="h-8 w-full" showLottie={showLottie} lottieSize="sm" />
        ))}
      </div>
    ))}
    {showLottie && (
      <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg">
        <LottieLoading size="lg" text={lottieText} />
      </div>
    )}
  </div>
);

export const EnhancedSkeletonChart: React.FC<{ 
  className?: string;
  showLottie?: boolean;
  lottieText?: string;
}> = ({ className, showLottie = false, lottieText = "กำลังโหลดกราฟ..." }) => (
  <div className={cn('bg-white rounded-lg border p-4 relative', className)}>
    <EnhancedSkeleton className="h-4 w-1/2 mb-4" showLottie={showLottie} lottieSize="sm" />
    <EnhancedSkeleton className="h-64 w-full rounded-lg" showLottie={showLottie} lottieSize="sm" />
    {showLottie && (
      <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg">
        <LottieLoading size="lg" text={lottieText} />
      </div>
    )}
  </div>
);

export const EnhancedSkeletonList: React.FC<{ 
  items?: number; 
  className?: string;
  showLottie?: boolean;
  lottieText?: string;
}> = ({ 
  items = 5, 
  className,
  showLottie = false,
  lottieText = "กำลังโหลดรายการ..."
}) => (
  <div className={cn('space-y-3 relative', className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3">
        <EnhancedSkeleton className="h-10 w-10 rounded-full" showLottie={showLottie} lottieSize="sm" />
        <div className="space-y-2 flex-1">
          <EnhancedSkeleton className="h-4 w-3/4" showLottie={showLottie} lottieSize="sm" />
          <EnhancedSkeleton className="h-3 w-1/2" showLottie={showLottie} lottieSize="sm" />
        </div>
      </div>
    ))}
    {showLottie && (
      <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg">
        <LottieLoading size="md" text={lottieText} />
      </div>
    )}
  </div>
);

export { EnhancedSkeleton as default };
export { EnhancedSkeleton };
