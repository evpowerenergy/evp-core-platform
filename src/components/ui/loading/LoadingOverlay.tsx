import React from 'react';
import { PageLoading } from './PageLoading';

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  children: React.ReactNode;
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  text = 'กำลังโหลด...',
  children,
  className = ''
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute inset-0 flex items-center justify-center z-50">
        <PageLoading type="dashboard" />
      </div>
    </div>
  );
};

export { LoadingOverlay as default };
export { LoadingOverlay };
