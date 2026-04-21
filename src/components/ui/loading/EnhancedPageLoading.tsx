import React from 'react';
import { EnhancedSkeleton, EnhancedSkeletonCard, EnhancedSkeletonTable, EnhancedSkeletonChart, EnhancedSkeletonList } from './EnhancedSkeleton';
import LottieLoading from './LottieLoading';

interface EnhancedPageLoadingProps {
  type?: 'dashboard' | 'table' | 'form' | 'chart' | 'custom';
  className?: string;
  customContent?: React.ReactNode;
  showLottie?: boolean;
  lottieText?: string;
  lottieSize?: 'sm' | 'md' | 'lg' | 'xl';
}

const EnhancedPageLoading: React.FC<EnhancedPageLoadingProps> = ({
  type = 'dashboard',
  className = '',
  customContent,
  showLottie = true,
  lottieText,
  lottieSize = 'lg'
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
        return 'กำลังโหลดฟอร์ม...';
      case 'chart':
        return 'กำลังโหลดกราฟ...';
      default:
        return 'กำลังโหลดข้อมูล...';
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <EnhancedSkeleton className="h-8 w-64" showLottie={showLottie} lottieSize="sm" />
                <EnhancedSkeleton className="h-4 w-48" showLottie={showLottie} lottieSize="sm" />
              </div>
              <div className="flex gap-3">
                <EnhancedSkeleton className="h-10 w-24" showLottie={showLottie} lottieSize="sm" />
                <EnhancedSkeleton className="h-10 w-32" showLottie={showLottie} lottieSize="sm" />
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <EnhancedSkeletonCard 
                  key={i} 
                  showLottie={showLottie} 
                  lottieText={i === 0 ? getLottieText() : undefined}
                />
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EnhancedSkeletonChart showLottie={showLottie} lottieText="กำลังโหลดกราฟ..." />
              <EnhancedSkeletonChart showLottie={showLottie} lottieText="กำลังโหลดกราฟ..." />
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <EnhancedSkeleton className="h-8 w-48" showLottie={showLottie} lottieSize="sm" />
              <div className="flex gap-2">
                <EnhancedSkeleton className="h-10 w-24" showLottie={showLottie} lottieSize="sm" />
                <EnhancedSkeleton className="h-10 w-32" showLottie={showLottie} lottieSize="sm" />
              </div>
            </div>
            
            {/* Table */}
            <EnhancedSkeletonTable 
              rows={8} 
              columns={6} 
              showLottie={showLottie} 
              lottieText={getLottieText()}
            />
          </div>
        );

      case 'form':
        return (
          <div className="max-w-2xl space-y-6">
            <EnhancedSkeleton className="h-8 w-48" showLottie={showLottie} lottieSize="sm" />
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <EnhancedSkeleton className="h-4 w-24" showLottie={showLottie} lottieSize="sm" />
                  <EnhancedSkeleton className="h-10 w-full" showLottie={showLottie} lottieSize="sm" />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <EnhancedSkeleton className="h-10 w-24" showLottie={showLottie} lottieSize="sm" />
              <EnhancedSkeleton className="h-10 w-32" showLottie={showLottie} lottieSize="sm" />
            </div>
          </div>
        );

      case 'chart':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <EnhancedSkeleton className="h-8 w-64" showLottie={showLottie} lottieSize="sm" />
              <EnhancedSkeleton className="h-10 w-32" showLottie={showLottie} lottieSize="sm" />
            </div>
            <EnhancedSkeletonChart className="h-96" showLottie={showLottie} lottieText={getLottieText()} />
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <LottieLoading size={lottieSize} text={getLottieText()} />
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

export { EnhancedPageLoading as default };
export { EnhancedPageLoading };
