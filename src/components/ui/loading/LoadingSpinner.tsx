import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className,
  fullScreen = false
}) => {
  const spinner = (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-2',
      fullScreen && 'min-h-screen bg-gradient-to-br from-[#f0fdfa] via-[#e0f2fe] to-[#f1f5f9]',
      className
    )}>
      <Loader2 className={cn('animate-spin text-green-600', sizeClasses[size])} />
      {text && (
        <p className={cn(
          'text-gray-600 font-medium',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base',
          size === 'lg' && 'text-lg',
          size === 'xl' && 'text-xl'
        )}>
          {text}
        </p>
      )}
    </div>
  );

  return spinner;
};

export { LoadingSpinner as default };
export { LoadingSpinner };
