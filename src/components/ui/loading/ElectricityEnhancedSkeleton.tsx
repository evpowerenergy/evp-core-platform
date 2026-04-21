import React from 'react';
import { cn } from '@/lib/utils';
import ElectricityLoading from './ElectricityLoading';

interface ElectricityEnhancedSkeletonProps {
  className?: string;
  children?: React.ReactNode;
  showLottie?: boolean;
  lottieSize?: 'sm' | 'md' | 'lg' | 'xl';
  lottieText?: string;
}

const ElectricityEnhancedSkeleton: React.FC<ElectricityEnhancedSkeletonProps> = ({ 
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
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200/90 backdrop-blur-sm z-10">
          <ElectricityLoading 
            size={lottieSize} 
            text={lottieText}
          />
        </div>
      )}
    </div>
  );
};

// Enhanced Pre-built skeleton components with Electricity theme
export const ElectricitySkeletonCard: React.FC<{ 
  className?: string;
  showLottie?: boolean;
  lottieText?: string;
}> = ({ className, showLottie = false, lottieText = "กำลังโหลดข้อมูลพลังงาน..." }) => (
  <div className={cn('bg-white rounded-lg border p-4 relative', className)}>
    <div className="h-4 w-3/4 mb-2 bg-gray-200 rounded animate-pulse"></div>
    <div className="h-8 w-1/2 mb-2 bg-gray-200 rounded animate-pulse"></div>
    <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse"></div>
    {showLottie && (
      <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg z-10">
        <ElectricityLoading size="md" text={lottieText} />
      </div>
    )}
  </div>
);

export const ElectricitySkeletonTable: React.FC<{ 
  rows?: number; 
  columns?: number;
  showLottie?: boolean;
  lottieText?: string;
}> = ({ 
  rows = 5, 
  columns = 4,
  showLottie = false,
  lottieText = "กำลังโหลดตารางข้อมูลพลังงาน..."
}) => (
  <div className="space-y-2 relative">
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div key={colIndex} className="h-8 w-full bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    ))}
    {showLottie && (
      <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg z-10">
        <ElectricityLoading size="lg" text={lottieText} />
      </div>
    )}
  </div>
);

export const ElectricitySkeletonChart: React.FC<{ 
  className?: string;
  showLottie?: boolean;
  lottieText?: string;
}> = ({ className, showLottie = false, lottieText = "กำลังโหลดกราฟข้อมูลพลังงาน..." }) => (
  <div className={cn('bg-white rounded-lg border p-4 relative', className)}>
    <div className="h-4 w-1/2 mb-4 bg-gray-200 rounded animate-pulse"></div>
    <div className="h-64 w-full rounded-lg bg-gray-200 animate-pulse"></div>
    {showLottie && (
      <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg z-10">
        <ElectricityLoading size="lg" text={lottieText} />
      </div>
    )}
  </div>
);

export const ElectricitySkeletonList: React.FC<{ 
  items?: number; 
  className?: string;
  showLottie?: boolean;
  lottieText?: string;
}> = ({ 
  items = 5, 
  className,
  showLottie = false,
  lottieText = "กำลังโหลดรายการข้อมูลพลังงาน..."
}) => (
  <div className={cn('space-y-3 relative', className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    ))}
    {showLottie && (
      <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg z-10">
        <ElectricityLoading size="md" text={lottieText} />
      </div>
    )}
  </div>
);

export default ElectricityEnhancedSkeleton;
