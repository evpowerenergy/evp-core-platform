import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';

interface CustomLottieLoadingProps {
  animationPath: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl';
  className?: string;
  text?: string;
  loop?: boolean;
  autoplay?: boolean;
  fallbackText?: string;
}

const sizeClasses = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
  '2xl': 'w-16 h-16',
  '3xl': 'w-20 h-20',
  '4xl': 'w-24 h-24',
  '5xl': 'w-32 h-32',
  '6xl': 'w-40 h-40',
  '7xl': 'w-48 h-48',
  '8xl': 'w-56 h-56'
};

const CustomLottieLoading: React.FC<CustomLottieLoadingProps> = ({
  animationPath,
  size = '8xl',
  className = '',
  text,
  loop = true,
  autoplay = true,
  fallbackText = 'กำลังโหลด...'
}) => {
  const [animationData, setAnimationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Load animation data from file
  useEffect(() => {
    const loadAnimation = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const response = await fetch(animationPath);
        if (!response.ok) {
          throw new Error(`Failed to load animation: ${response.status}`);
        }
        
        const data = await response.json();
        setAnimationData(data);
      } catch (err) {
        console.error('Error loading Lottie animation:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadAnimation();
  }, [animationPath]);

  // Show Lottie animation immediately, no loading state

  // Error state - show Lottie animation even if file failed to load
  if (error || !animationData) {
    return (
      <div className={cn('flex flex-col items-center justify-center', className)}>
        <div className={cn(sizeClasses[size])}>
          <Lottie
            animationData={null}
            loop={loop}
            autoplay={autoplay}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <p className={cn(
          'text-gray-600 font-medium mt-2',
          size === 'xs' && 'text-xs',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-sm',
          size === 'xl' && 'text-sm',
          size === '2xl' && 'text-sm',
          size === '3xl' && 'text-sm',
          size === '4xl' && 'text-sm',
          size === '5xl' && 'text-sm',
          size === '6xl' && 'text-sm',
          size === '7xl' && 'text-sm',
          size === '8xl' && 'text-sm'
        )}>
          {text || fallbackText}
        </p>
      </div>
    );
  }

  // Always show Lottie animation immediately
  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div className={cn(sizeClasses[size])}>
        <Lottie
          animationData={animationData}
          loop={loop}
          autoplay={autoplay}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      {text && (
        <p className={cn(
          'text-gray-600 font-medium mt-2',
          size === 'xs' && 'text-xs',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-sm',
          size === 'xl' && 'text-sm',
          size === '2xl' && 'text-sm',
          size === '3xl' && 'text-sm',
          size === '4xl' && 'text-sm',
          size === '5xl' && 'text-sm',
          size === '6xl' && 'text-sm',
          size === '7xl' && 'text-sm',
          size === '8xl' && 'text-sm'
        )}>
          {text}
        </p>
      )}
    </div>
  );
};

export default CustomLottieLoading;
