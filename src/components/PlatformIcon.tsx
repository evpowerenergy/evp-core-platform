import React, { useState, useEffect } from 'react';

interface PlatformIconProps {
  platform: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PlatformIcon: React.FC<PlatformIconProps> = ({ 
  platform, 
  size = 'md',
  className = '' 
}) => {
  const [iconSrc, setIconSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  useEffect(() => {
    const loadIcon = () => {
      setIsLoading(true);
      setHasError(false);
      
      let src = '';
      
      switch (platform?.toLowerCase()) {
        case 'line':
          src = '/icons/line_logo.svg';
          break;
        case 'facebook':
          src = '/icons/facebook_logo.svg';
          break;
        case 'huawei':
          src = '/icons/huawei_logo.svg';
          break;
        case 'website':
          src = '/icons/website_logo.svg';
          break;
        case 'tiktok':
          src = '/icons/tiktok_logo.svg';
          break;
        case 'ig':
          src = '/icons/ig_logo.svg';
          break;
        case 'youtube':
          src = '/icons/youtube_logo.svg';
          break;
        case 'shopee':
          src = '/icons/shopee_logo.svg';
          break;
        case 'lazada':
          src = '/icons/lazada_logo.svg';
          break;
        case 'แนะนำ':
          src = '/icons/person_logo.svg';
          break;
        case 'outbound':
          src = '/icons/support_logo.svg';
          break;
        case 'โทร':
          src = '/icons/phone_logo.svg';
          break;
        case 'atmoce':
          src = '/icons/atmoce_logo.svg';
          break;
        case 'sigenergy':
          src = '/icons/sigenergy_logo.svg';
          break;
        default:
          src = '/icons/facebook_logo.svg';
      }
      
  
      setIconSrc(src);
    };

    loadIcon();
  }, [platform]);

  const handleImageLoad = () => {

    setIsLoading(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Failed to load icon for platform:', platform, 'src:', e.currentTarget.src);
    setIsLoading(false);
    setHasError(true);
    setIconSrc('/icons/facebook_logo.svg'); // Fallback
  };

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-200 rounded animate-pulse flex items-center justify-center ${className}`}>
        <div className="w-1/2 h-1/2 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-100 rounded flex items-center justify-center ${className}`}>
        <span className="text-xs text-gray-500 font-medium">{platform?.charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <div className={`platform-icon ${className}`}>
      <img 
        src={iconSrc || '/icons/facebook_logo.svg'} 
        alt={platform || 'Platform'} 
        className={`${sizeClasses[size]} object-contain`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};

export default PlatformIcon; 