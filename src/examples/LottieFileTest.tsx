import React, { useState } from 'react';
import { ElectricityLoading } from '@/components/ui/loading';

export const LottieFileTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testLottieFile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/animations/electricity_loading.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      alert('ไฟล์ Lottie JSON โหลดสำเร็จ!');
    } catch (err) {
      console.error('Error loading Lottie file:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">ทดสอบไฟล์ Lottie</h3>
      
      <div className="p-4 border rounded-lg bg-gray-50">
        <h4 className="font-medium mb-2">ไฟล์: /animations/electricity_loading.json</h4>
        <p className="text-sm text-gray-600 mb-4">
          ทดสอบการโหลดไฟล์ Lottie และแสดงผล animation
        </p>
        
        <div className="flex gap-4 mb-4">
          <button 
            onClick={testLottieFile}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'กำลังทดสอบ...' : 'ทดสอบไฟล์ Lottie'}
          </button>
        </div>
        
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <div className="text-center p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Extra Small (16px)</h4>
          <div className="flex justify-center">
            <ElectricityLoading size="xs" />
          </div>
        </div>
        
        <div className="text-center p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Small (24px)</h4>
          <div className="flex justify-center">
            <ElectricityLoading size="sm" />
          </div>
        </div>
        
        <div className="text-center p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Medium (32px)</h4>
          <div className="flex justify-center">
            <ElectricityLoading size="md" />
          </div>
        </div>
        
        <div className="text-center p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Large (40px)</h4>
          <div className="flex justify-center">
            <ElectricityLoading size="lg" />
          </div>
        </div>
        
        <div className="text-center p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Extra Large (48px)</h4>
          <div className="flex justify-center">
            <ElectricityLoading size="xl" />
          </div>
        </div>

        <div className="text-center p-4 border rounded-lg">
          <h4 className="font-medium mb-2">2XL (64px)</h4>
          <div className="flex justify-center">
            <ElectricityLoading size="2xl" />
          </div>
        </div>

        <div className="text-center p-4 border rounded-lg">
          <h4 className="font-medium mb-2">3XL (80px)</h4>
          <div className="flex justify-center">
            <ElectricityLoading size="3xl" />
          </div>
        </div>

        <div className="text-center p-4 border rounded-lg">
          <h4 className="font-medium mb-2">4XL (96px)</h4>
          <div className="flex justify-center">
            <ElectricityLoading size="4xl" />
          </div>
        </div>

        <div className="text-center p-4 border rounded-lg">
          <h4 className="font-medium mb-2">5XL (128px)</h4>
          <div className="flex justify-center">
            <ElectricityLoading size="5xl" />
          </div>
        </div>

        <div className="text-center p-4 border rounded-lg">
          <h4 className="font-medium mb-2">6XL (160px)</h4>
          <div className="flex justify-center">
            <ElectricityLoading size="6xl" />
          </div>
        </div>

        <div className="text-center p-4 border rounded-lg">
          <h4 className="font-medium mb-2">7XL (192px)</h4>
          <div className="flex justify-center">
            <ElectricityLoading size="7xl" />
          </div>
        </div>

        <div className="text-center p-4 border rounded-lg">
          <h4 className="font-medium mb-2">8XL (224px)</h4>
          <div className="flex justify-center">
            <ElectricityLoading size="8xl" />
          </div>
        </div>
      </div>
    </div>
  );
};
