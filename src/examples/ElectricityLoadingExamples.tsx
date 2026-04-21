import React, { useState } from 'react';
import { 
  ElectricityLoading,
  ElectricityLoadingSmall,
  ElectricityLoadingMedium,
  ElectricityLoadingLarge,
  ElectricityLoadingExtraLarge,
  ElectricityPageLoading,
  ElectricitySkeletonCard,
  ElectricitySkeletonTable,
  ElectricitySkeletonChart,
  ElectricitySkeletonList,
  useLoadingState 
} from '@/components/ui/loading';

// ตัวอย่างการใช้งาน Electricity Loading
export const ElectricityLoadingExample = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Electricity Loading Examples</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <ElectricityLoadingSmall text="Small" />
        </div>
        <div className="text-center">
          <ElectricityLoadingMedium text="Medium" />
        </div>
        <div className="text-center">
          <ElectricityLoadingLarge text="Large" />
        </div>
        <div className="text-center">
          <ElectricityLoadingExtraLarge text="Extra Large" />
        </div>
      </div>
    </div>
  );
};

// ตัวอย่างการใช้งาน Electricity Skeleton
export const ElectricitySkeletonExample = () => {
  const [showLottie, setShowLottie] = useState(true);
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Electricity Skeleton Examples</h3>
      
      <div className="flex gap-4 mb-4">
        <button 
          onClick={() => setShowLottie(!showLottie)}
          className={`px-4 py-2 rounded ${showLottie ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
        >
          {showLottie ? 'ซ่อน' : 'แสดง'} Electricity Animation
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-2">Electricity Skeleton Cards</h4>
          <div className="space-y-4">
            <ElectricitySkeletonCard showLottie={showLottie} lottieText="กำลังโหลดข้อมูลพลังงาน..." />
            <ElectricitySkeletonCard showLottie={showLottie} lottieText="กำลังประมวลผลข้อมูลพลังงาน..." />
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Electricity Skeleton Table</h4>
          <ElectricitySkeletonTable 
            rows={3} 
            columns={3} 
            showLottie={showLottie} 
            lottieText="กำลังโหลดตารางข้อมูลพลังงาน..."
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-2">Electricity Skeleton Chart</h4>
          <ElectricitySkeletonChart 
            showLottie={showLottie} 
            lottieText="กำลังโหลดกราฟข้อมูลพลังงาน..."
          />
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Electricity Skeleton List</h4>
          <ElectricitySkeletonList 
            items={3} 
            showLottie={showLottie} 
            lottieText="กำลังโหลดรายการข้อมูลพลังงาน..."
          />
        </div>
      </div>
    </div>
  );
};

// ตัวอย่างการใช้งาน Electricity PageLoading
export const ElectricityPageLoadingExample = () => {
  const [loadingType, setLoadingType] = useState<'dashboard' | 'table' | 'form' | 'chart'>('dashboard');
  const [showLottie, setShowLottie] = useState(true);
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Electricity Page Loading Examples</h3>
      
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setLoadingType('dashboard')}
          className={`px-3 py-1 rounded ${loadingType === 'dashboard' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
        >
          Dashboard
        </button>
        <button 
          onClick={() => setLoadingType('table')}
          className={`px-3 py-1 rounded ${loadingType === 'table' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
        >
          Table
        </button>
        <button 
          onClick={() => setLoadingType('form')}
          className={`px-3 py-1 rounded ${loadingType === 'form' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
        >
          Form
        </button>
        <button 
          onClick={() => setLoadingType('chart')}
          className={`px-3 py-1 rounded ${loadingType === 'chart' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
        >
          Chart
        </button>
        <button 
          onClick={() => setShowLottie(!showLottie)}
          className={`px-3 py-1 rounded ${showLottie ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          {showLottie ? 'ซ่อน' : 'แสดง'} Electricity Animation
        </button>
      </div>
      
      <ElectricityPageLoading 
        type={loadingType} 
        showLottie={showLottie}
        lottieText={`กำลังโหลด${loadingType === 'dashboard' ? ' Dashboard พลังงาน' : loadingType === 'table' ? ' ตารางข้อมูลพลังงาน' : loadingType === 'form' ? ' ฟอร์มข้อมูลพลังงาน' : ' กราฟข้อมูลพลังงาน'}...`}
      />
    </div>
  );
};

// ตัวอย่างการใช้งานกับ Loading State
export const ElectricityLoadingStateExample = () => {
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
      <h3 className="text-lg font-semibold">Electricity Loading State Example</h3>
      
      <div className="p-6 border rounded-lg">
        <h4 className="text-lg font-medium mb-4">ฟอร์มข้อมูลพลังงาน</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">ชื่อลูกค้า</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded"
              placeholder="กรอกชื่อลูกค้า"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ปริมาณการใช้ไฟฟ้า</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded"
              placeholder="กรอกปริมาณการใช้ไฟฟ้า (kWh)"
            />
          </div>
          <button 
            onClick={handleAsyncAction}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? 'กำลังบันทึกข้อมูลพลังงาน...' : 'บันทึกข้อมูลพลังงาน'}
          </button>
        </div>
        
        {isLoading && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <ElectricitySkeletonCard 
              showLottie={true} 
              lottieText="กำลังบันทึกข้อมูลพลังงาน..."
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ตัวอย่างการใช้งานแบบครบถ้วน
export const CompleteElectricityExample = () => {
  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold">Electricity Loading System with Custom Lottie</h2>
      
      <ElectricityLoadingExample />
      <ElectricitySkeletonExample />
      <ElectricityPageLoadingExample />
      <ElectricityLoadingStateExample />
    </div>
  );
};
