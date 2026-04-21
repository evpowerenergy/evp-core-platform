import React from 'react';
import CustomLottieLoading from './CustomLottieLoading';
import { cn } from '@/lib/utils';

interface ElectricityLoadingProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl';
  className?: string;
  text?: string;
  loop?: boolean;
  autoplay?: boolean;
}

const ElectricityLoading: React.FC<ElectricityLoadingProps> = ({
  size = '8xl',
  className = '',
  text = 'กำลังโหลดข้อมูลพลังงาน...',
  loop = true,
  autoplay = true
}) => {
  return (
    <CustomLottieLoading
      animationPath="/animations/electricity_loading.json"
      size={size}
      className={className}
      text={text}
      loop={loop}
      autoplay={autoplay}
      fallbackText="กำลังโหลดข้อมูลพลังงาน..."
    />
  );
};

// Pre-configured electricity loading components
export const ElectricityLoadingExtraSmall: React.FC<{ text?: string; className?: string }> = ({ 
  text = "กำลังโหลด...", 
  className 
}) => (
  <ElectricityLoading size="xs" text={text} className={className} />
);

export const ElectricityLoadingSmall: React.FC<{ text?: string; className?: string }> = ({ 
  text = "กำลังโหลด...", 
  className 
}) => (
  <ElectricityLoading size="sm" text={text} className={className} />
);

export const ElectricityLoadingMedium: React.FC<{ text?: string; className?: string }> = ({ 
  text = "กำลังโหลดข้อมูลพลังงาน...", 
  className 
}) => (
  <ElectricityLoading size="md" text={text} className={className} />
);

export const ElectricityLoadingLarge: React.FC<{ text?: string; className?: string }> = ({ 
  text = "กำลังโหลดข้อมูลพลังงาน...", 
  className 
}) => (
  <ElectricityLoading size="lg" text={text} className={className} />
);

export const ElectricityLoadingExtraLarge: React.FC<{ text?: string; className?: string }> = ({ 
  text = "กำลังโหลดข้อมูลพลังงาน...", 
  className 
}) => (
  <ElectricityLoading size="xl" text={text} className={className} />
);

export const ElectricityLoading2XL: React.FC<{ text?: string; className?: string }> = ({ 
  text = "กำลังโหลดข้อมูลพลังงาน...", 
  className 
}) => (
  <ElectricityLoading size="2xl" text={text} className={className} />
);

export const ElectricityLoading3XL: React.FC<{ text?: string; className?: string }> = ({ 
  text = "กำลังโหลดข้อมูลพลังงาน...", 
  className 
}) => (
  <ElectricityLoading size="3xl" text={text} className={className} />
);

export const ElectricityLoading4XL: React.FC<{ text?: string; className?: string }> = ({ 
  text = "กำลังโหลดข้อมูลพลังงาน...", 
  className 
}) => (
  <ElectricityLoading size="4xl" text={text} className={className} />
);

export const ElectricityLoading5XL: React.FC<{ text?: string; className?: string }> = ({ 
  text = "กำลังโหลดข้อมูลพลังงาน...", 
  className 
}) => (
  <ElectricityLoading size="5xl" text={text} className={className} />
);

export const ElectricityLoading6XL: React.FC<{ text?: string; className?: string }> = ({ 
  text = "กำลังโหลดข้อมูลพลังงาน...", 
  className 
}) => (
  <ElectricityLoading size="6xl" text={text} className={className} />
);

export const ElectricityLoading7XL: React.FC<{ text?: string; className?: string }> = ({ 
  text = "กำลังโหลดข้อมูลพลังงาน...", 
  className 
}) => (
  <ElectricityLoading size="7xl" text={text} className={className} />
);

export const ElectricityLoading8XL: React.FC<{ text?: string; className?: string }> = ({ 
  text = "กำลังโหลดข้อมูลพลังงาน...", 
  className 
}) => (
  <ElectricityLoading size="8xl" text={text} className={className} />
);

export default ElectricityLoading;
