import React, { useState } from 'react';

interface SimplePlatformIconProps {
  platform: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SimplePlatformIcon: React.FC<SimplePlatformIconProps> = ({ 
  platform, 
  size = 'md',
  className = '' 
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const getIconSrc = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'line':
        return '/icons/line_logo.svg';
      case 'facebook':
        return '/icons/facebook_logo.svg';
      case 'huawei':
        return '/icons/huawei_logo.svg';
      case 'huawei (c&i)':
        return '/icons/huawei_logo.svg';
      case 'website':
        return '/icons/website_logo.svg';
      case 'tiktok':
        return '/icons/tiktok_logo.svg';
      case 'ig':
        return '/icons/ig_logo.svg';
      case 'youtube':
        return '/icons/youtube_logo.svg';
      case 'shopee':
        return '/icons/shopee_logo.svg';
      case 'lazada':
        return '/icons/lazada_logo.svg';
      case 'แนะนำ':
        return '/icons/person_logo.svg';
      case 'outbound':
        return '/icons/support_logo.svg';
      case 'โทร':
        return '/icons/phone_logo.svg';
      case 'atmoce':
        return '/icons/atmoce_logo.svg';
      case 'solar edge':
        return '/icons/solar_edge_logo.svg';
      case 'sigenergy':
        return '/icons/sigenergy_logo.svg';
      case 'solvana':
        return '/icons/solvana_logo.svg';
      case 'terawatt':
        return '/icons/terawatt_logo.svg';
      case 'ลูกค้าเก่า service ครบ':
        return '/icons/service_logo.svg';
      default:
        return '/icons/facebook_logo.svg';
    }
  };

  const handleError = () => {
    console.error('Failed to load icon for platform:', platform);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-100 rounded flex items-center justify-center ${className}`}>
        <span className="text-xs text-gray-500 font-medium">{platform?.charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <img 
      src={getIconSrc(platform)} 
      alt={platform || 'Platform'} 
      className={`${sizeClasses[size]} object-contain ${className}`}
      onError={handleError}
    />
  );
};

export default SimplePlatformIcon; 