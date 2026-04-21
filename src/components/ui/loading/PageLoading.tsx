import React from 'react';
import { Skeleton, SkeletonCard, SkeletonChart, SkeletonTable } from './Skeleton';
import ElectricityLoading from './ElectricityLoading';

interface PageLoadingProps {
  type?: 'dashboard' | 'table' | 'form' | 'chart' | 'custom';
  className?: string;
  customContent?: React.ReactNode;
  showLottie?: boolean;
  lottieText?: string;
  lottieSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl';
}

const PageLoading: React.FC<PageLoadingProps> = ({
  type = 'dashboard',
  className = '',
  customContent,
  showLottie = true,
  lottieText,
  lottieSize = '8xl'
}) => {
  if (customContent) {
    return <div className={className}>{customContent}</div>;
  }

  const getLottieText = () => {
    if (lottieText) return lottieText;
    
    switch (type) {
      case 'dashboard':
        return 'กำลังโหลดข้อมูล Dashboard...';
      case 'table':
        return 'กำลังโหลดตารางข้อมูล...';
      case 'form':
        return 'กำลังโหลดฟอร์มข้อมูล...';
      case 'chart':
        return 'กำลังโหลดกราฟข้อมูล...';
      default:
        return 'กำลังโหลดข้อมูล...';
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'dashboard':
        return (
          <div className="space-y-6 relative">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SkeletonChart />
              <SkeletonChart />
            </div>

            {/* Single Lottie Overlay */}
            {showLottie && (
              <div className="fixed inset-0 flex items-center justify-center  z-50">
                <div className="flex flex-col items-center gap-2">
                  <ElectricityLoading size="8xl" text={getLottieText()} />
                </div>
              </div>
            )}
          </div>
        );

      case 'table':
        return (
          <div className="space-y-4 relative">
            {/* Header */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
            
            {/* Table */}
            <SkeletonTable rows={8} columns={6} />

            {/* Single Lottie Overlay */}
            {showLottie && (
              <div className="fixed inset-0 flex items-center justify-center  z-50">
                <div className="flex flex-col items-center gap-2">
                  <ElectricityLoading size="8xl" text={getLottieText()} />
                </div>
              </div>
            )}
          </div>
        );

      case 'form':
        return (
          <div className="max-w-2xl space-y-6 relative">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
            {showLottie && (
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <ElectricityLoading size="8xl" text={getLottieText()} />
              </div>
            )}
          </div>
        );

      case 'chart':
        return (
          <div className="space-y-6 relative">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-10 w-32" />
            </div>
            <SkeletonChart className="h-96" />
            {showLottie && (
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <ElectricityLoading size="8xl" text={getLottieText()} />
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="relative">
            <Skeleton className="h-64 w-full" />
            {showLottie && (
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <ElectricityLoading size="8xl" text={getLottieText()} />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className={`p-6 ${className}`}>
      {renderContent()}
    </div>
  );
};

export { PageLoading as default };
export { PageLoading };
