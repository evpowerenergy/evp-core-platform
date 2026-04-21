
import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0fdfa] via-[#e0f2fe] to-[#f1f5f9]">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <p className="text-gray-600 font-medium">กำลังโหลด...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
