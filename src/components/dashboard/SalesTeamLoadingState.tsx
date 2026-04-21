
import React from 'react';

const SalesTeamLoadingState = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลทีมขาย...</p>
      </div>
    </div>
  );
};

export default SalesTeamLoadingState;
