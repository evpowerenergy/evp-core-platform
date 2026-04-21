import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  text = 'กำลังโหลด...'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div 
        className={cn(
          'animate-spin rounded-full border-b-2 border-blue-600',
          sizeClasses[size]
        )}
      />
      {text && (
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
};

export const LoadingSpinnerInline: React.FC<Omit<LoadingSpinnerProps, 'text'>> = ({ 
  size = 'sm', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  };

  return (
    <div 
      className={cn(
        'animate-spin rounded-full border-b-2 border-current',
        sizeClasses[size],
        className
      )}
    />
  );
};

export const LoadingSkeleton: React.FC<{
  className?: string;
  lines?: number;
}> = ({ className, lines = 3 }) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-gray-200 h-4 rounded"
          style={{ 
            width: `${Math.random() * 40 + 60}%` 
          }}
        />
      ))}
    </div>
  );
};

export const LoadingCard: React.FC<{
  className?: string;
  title?: string;
}> = ({ className, title = 'กำลังโหลดข้อมูล...' }) => {
  return (
    <div className={cn('p-6 space-y-4', className)}>
      <div className="animate-pulse">
        <div className="bg-gray-200 h-6 w-48 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="bg-gray-200 h-4 rounded w-full"></div>
          <div className="bg-gray-200 h-4 rounded w-3/4"></div>
          <div className="bg-gray-200 h-4 rounded w-1/2"></div>
        </div>
      </div>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
}; 