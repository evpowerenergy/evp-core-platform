import React from 'react';
import { 
  LoadingSpinner, 
  LoadingOverlay, 
  PageLoading, 
  SkeletonCard, 
  SkeletonTable,
  SkeletonList,
  useLoadingState,
  useMultipleLoadingStates 
} from '@/components/ui/loading';

// ตัวอย่างการใช้งาน LoadingSpinner
export const SpinnerExample = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Loading Spinner Examples</h3>
      
      {/* Small spinner */}
      <div className="flex items-center gap-4">
        <LoadingSpinner size="sm" />
        <span>Small spinner</span>
      </div>
      
      {/* Medium spinner with text */}
      <div className="flex items-center gap-4">
        <LoadingSpinner size="md" text="กำลังโหลด..." />
        <span>Medium spinner with text</span>
      </div>
      
      {/* Large spinner */}
      <div className="flex items-center gap-4">
        <LoadingSpinner size="lg" text="กำลังประมวลผล..." />
        <span>Large spinner</span>
      </div>
      
      {/* Full screen spinner */}
      <LoadingSpinner size="xl" text="กำลังเข้าสู่ระบบ..." fullScreen />
    </div>
  );
};

// ตัวอย่างการใช้งาน LoadingOverlay
export const OverlayExample = () => {
  const { isLoading, withLoading } = useLoadingState();
  
  const handleAsyncAction = async () => {
    await withLoading(async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Loading Overlay Example</h3>
      
      <LoadingOverlay isLoading={isLoading} text="กำลังบันทึกข้อมูล...">
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
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              บันทึกข้อมูล
            </button>
          </div>
        </div>
      </LoadingOverlay>
    </div>
  );
};

// ตัวอย่างการใช้งาน PageLoading
export const PageLoadingExample = () => {
  const [loadingType, setLoadingType] = React.useState<'dashboard' | 'table' | 'form' | 'chart'>('dashboard');
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Page Loading Examples</h3>
      
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
      </div>
      
      <PageLoading type={loadingType} />
    </div>
  );
};

// ตัวอย่างการใช้งาน Multiple Loading States
export const MultipleLoadingExample = () => {
  const { isLoading, withLoading, isAnyLoading } = useMultipleLoadingStates(['data', 'chart', 'table']);
  
  const loadData = async () => {
    await withLoading('data', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    });
  };
  
  const loadChart = async () => {
    await withLoading('chart', async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
    });
  };
  
  const loadTable = async () => {
    await withLoading('table', async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
    });
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Multiple Loading States Example</h3>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <h4 className="font-medium mb-2">ข้อมูล</h4>
          {isLoading('data') ? (
            <LoadingSpinner size="sm" text="โหลดข้อมูล..." />
          ) : (
            <button onClick={loadData} className="px-3 py-1 bg-blue-500 text-white rounded">
              โหลดข้อมูล
            </button>
          )}
        </div>
        
        <div className="p-4 border rounded">
          <h4 className="font-medium mb-2">กราฟ</h4>
          {isLoading('chart') ? (
            <LoadingSpinner size="sm" text="โหลดกราฟ..." />
          ) : (
            <button onClick={loadChart} className="px-3 py-1 bg-green-500 text-white rounded">
              โหลดกราฟ
            </button>
          )}
        </div>
        
        <div className="p-4 border rounded">
          <h4 className="font-medium mb-2">ตาราง</h4>
          {isLoading('table') ? (
            <LoadingSpinner size="sm" text="โหลดตาราง..." />
          ) : (
            <button onClick={loadTable} className="px-3 py-1 bg-purple-500 text-white rounded">
              โหลดตาราง
            </button>
          )}
        </div>
      </div>
      
      <div className="p-4 bg-gray-100 rounded">
        <p className="text-sm">
          มีการโหลดอยู่: {isAnyLoading ? 'ใช่' : 'ไม่'}
        </p>
      </div>
    </div>
  );
};

// ตัวอย่างการใช้งาน Skeleton Components
export const SkeletonExample = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Skeleton Components Example</h3>
      
      {/* Skeleton Cards */}
      <div>
        <h4 className="font-medium mb-2">Skeleton Cards</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
      
      {/* Skeleton Table */}
      <div>
        <h4 className="font-medium mb-2">Skeleton Table</h4>
        <SkeletonTable rows={5} columns={4} />
      </div>
      
      {/* Skeleton List */}
      <div>
        <h4 className="font-medium mb-2">Skeleton List</h4>
        <SkeletonList items={3} />
      </div>
    </div>
  );
};

// ตัวอย่างการใช้งานแบบครบถ้วน
export const CompleteExample = () => {
  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold">Loading System Examples</h2>
      
      <SpinnerExample />
      <OverlayExample />
      <PageLoadingExample />
      <MultipleLoadingExample />
      <SkeletonExample />
    </div>
  );
};
