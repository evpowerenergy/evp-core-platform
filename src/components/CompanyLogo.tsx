import React from 'react';

interface CompanyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white' | 'gradient';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
  clickable?: boolean;
}

const CompanyLogo: React.FC<CompanyLogoProps> = ({ 
  size = 'md', 
  variant = 'default', 
  showText = true,
  className = '',
  onClick,
  clickable = false
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const textVariantClasses = {
    default: 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent',
    white: 'text-white',
    gradient: 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'
  };

  const handleClick = () => {
    if (clickable && onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`flex items-center gap-3 ${className} ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity duration-200' : ''}`}
      onClick={handleClick}
    >
      {/* Logo Icon - No background or border */}
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        <img 
          src="/logo.svg" 
          alt="EV Power Energy" 
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Company Name */}
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${textSizeClasses[size]} font-bold ${textVariantClasses[variant]}`}>
            EV Power Energy
          </h1>
          <p className={`text-xs text-gray-500 ${size === 'sm' ? 'hidden' : ''}`}>
            CRM System
          </p>
        </div>
      )}
    </div>
  );
};

export default CompanyLogo; 