import React from 'react';
import { 
  ElectricitySkeletonCard, 
  ElectricitySkeletonTable, 
  ElectricitySkeletonChart, 
  ElectricitySkeletonList 
} from './ElectricityEnhancedSkeleton';
import ElectricityLoading from './ElectricityLoading';

interface ElectricityPageLoadingProps {
  type?: 'dashboard' | 'table' | 'form' | 'chart' | 'custom';
  className?: string;
  customContent?: React.ReactNode;
  showLottie?: boolean;
  lottieText?: string;
  lottieSize?: 'sm' | 'md' | 'lg' | 'xl';
}

const ElectricityPageLoading: React.FC<ElectricityPageLoadingProps> = ({
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
        return 'กำลังโหลดข้อมูล Dashboard พลังงาน...';
      case 'table':
        return 'กำลังโหลดตารางข้อมูลพลังงาน...';
      case 'form':
        return 'กำลังโหลดฟอร์มข้อมูลพลังงาน...';
      case 'chart':
        return 'กำลังโหลดกราฟข้อมูลพลังงาน...';
      default:
        return 'กำลังโหลดข้อมูลพลังงาน...';
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
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <ElectricitySkeletonCard 
                  key={i} 
                  showLottie={showLottie} 
                  lottieText={i === 0 ? getLottieText() : undefined}
                />
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ElectricitySkeletonChart showLottie={showLottie} lottieText="กำลังโหลดกราฟข้อมูลพลังงาน..." />
              <ElectricitySkeletonChart showLottie={showLottie} lottieText="กำลังโหลดกราฟข้อมูลพลังงาน..." />
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* Table */}
            <ElectricitySkeletonTable 
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
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        );

      case 'chart':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <ElectricitySkeletonChart className="h-96" showLottie={showLottie} lottieText={getLottieText()} />
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <ElectricityLoading size={lottieSize} text={getLottieText()} />
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

export default ElectricityPageLoading;
