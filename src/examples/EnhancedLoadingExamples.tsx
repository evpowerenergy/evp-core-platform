import React, { useState } from 'react';
import { 
  LottieLoading, 
  EnhancedPageLoading, 
  EnhancedSkeletonCard, 
  EnhancedSkeletonTable,
  EnhancedSkeletonChart,
  EnhancedSkeletonList,
  useLoadingState 
} from '@/components/ui/loading';

// ตัวอย่างการใช้งาน LottieLoading
export const LottieExample = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Lottie Loading Examples</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <LottieLoading size="sm" text="Small" />
        </div>
        <div className="text-center">
          <LottieLoading size="md" text="Medium" />
        </div>
        <div className="text-center">
          <LottieLoading size="lg" text="Large" />
        </div>
        <div className="text-center">
          <LottieLoading size="xl" text="Extra Large" />
        </div>
      </div>
    </div>
  );
};

// ตัวอย่างการใช้งาน Enhanced Skeleton
export const EnhancedSkeletonExample = () => {
  const [showLottie, setShowLottie] = useState(true);
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Enhanced Skeleton Examples</h3>
      
      <div className="flex gap-4 mb-4">
        <button 
          onClick={() => setShowLottie(!showLottie)}
          className={`px-4 py-2 rounded ${showLottie ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          {showLottie ? 'ซ่อน' : 'แสดง'} Lottie Animation
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-2">Enhanced Skeleton Cards</h4>
          <div className="space-y-4">
            <EnhancedSkeletonCard showLottie={showLottie} lottieText="กำลังโหลดข้อมูล..." />
            <EnhancedSkeletonCard showLottie={showLottie} lottieText="กำลังประมวลผล..." />
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Enhanced Skeleton Table</h4>
          <EnhancedSkeletonTable 
            rows={3} 
            columns={3} 
            showLottie={showLottie} 
            lottieText="กำลังโหลดตาราง..."
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-2">Enhanced Skeleton Chart</h4>
          <EnhancedSkeletonChart 
            showLottie={showLottie} 
            lottieText="กำลังโหลดกราฟ..."
          />
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Enhanced Skeleton List</h4>
          <EnhancedSkeletonList 
            items={3} 
            showLottie={showLottie} 
            lottieText="กำลังโหลดรายการ..."
          />
        </div>
      </div>
    </div>
  );
};

// ตัวอย่างการใช้งาน Enhanced PageLoading
export const EnhancedPageLoadingExample = () => {
  const [loadingType, setLoadingType] = useState<'dashboard' | 'table' | 'form' | 'chart'>('dashboard');
  const [showLottie, setShowLottie] = useState(true);
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Enhanced Page Loading Examples</h3>
      
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setLoadingType('dashboard')}
          className={`px-3 py-1 rounded ${loadingType === 'dashboard' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Dashboard
        </button>
        <button 
          onClick={() => setLoadingType('table')}
          className={`px-3 py-1 rounded ${loadingType === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Table
        </button>
        <button 
          onClick={() => setLoadingType('form')}
          className={`px-3 py-1 rounded ${loadingType === 'form' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Form
        </button>
        <button 
          onClick={() => setLoadingType('chart')}
          className={`px-3 py-1 rounded ${loadingType === 'chart' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Chart
        </button>
        <button 
          onClick={() => setShowLottie(!showLottie)}
          className={`px-3 py-1 rounded ${showLottie ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
        >
          {showLottie ? 'ซ่อน' : 'แสดง'} Lottie
        </button>
      </div>
      
      <EnhancedPageLoading 
        type={loadingType} 
        showLottie={showLottie}
        lottieText={`กำลังโหลด${loadingType === 'dashboard' ? ' Dashboard' : loadingType === 'table' ? ' ตาราง' : loadingType === 'form' ? ' ฟอร์ม' : ' กราฟ'}...`}
      />
    </div>
  );
};

// ตัวอย่างการใช้งานกับ Loading State
export const EnhancedLoadingStateExample = () => {
  const { isLoading, withLoading } = useLoadingState({
    delay: 500,
    minDuration: 1000
  });
  
  const handleAsyncAction = async () => {
    await withLoading(async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Enhanced Loading State Example</h3>
      
      <div className="p-6 border rounded-lg">
        <h4 className="text-lg font-medium mb-4">ฟอร์มข้อมูล</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">ชื่อ</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded"
              placeholder="กรอกชื่อของคุณ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">อีเมล</label>
            <input 
              type="email" 
              className="w-full p-2 border rounded"
              placeholder="กรอกอีเมลของคุณ"
            />
          </div>
          <button 
            onClick={handleAsyncAction}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </button>
        </div>
        
        {isLoading && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <EnhancedSkeletonCard 
              showLottie={true} 
              lottieText="กำลังบันทึกข้อมูล..."
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ตัวอย่างการใช้งานแบบครบถ้วน
export const CompleteEnhancedExample = () => {
  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold">Enhanced Loading System with Lottie</h2>
      
      <LottieExample />
      <EnhancedSkeletonExample />
      <EnhancedPageLoadingExample />
      <EnhancedLoadingStateExample />
    </div>
  );
};
