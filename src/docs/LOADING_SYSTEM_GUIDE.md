# ระบบ Loading State ที่มีประสิทธิภาพสูงสุด

## ภาพรวม

ระบบ Loading State นี้ถูกออกแบบมาเพื่อให้มีประสิทธิภาพสูงสุดและใช้งานง่าย โดยมีคุณสมบัติหลักดังนี้:

- **Progressive Loading**: แสดงผล loading แบบค่อยเป็นค่อยไป
- **Skeleton Loading**: แสดงโครงสร้างเนื้อหาขณะโหลด
- **Smart Loading**: มี delay และ minimum duration
- **Multiple States**: รองรับ loading states หลายตัวพร้อมกัน
- **Context Management**: จัดการ global loading state

## Components หลัก

### 1. LoadingSpinner
```tsx
import { LoadingSpinner } from '@/components/ui/loading';

// การใช้งานพื้นฐาน --- 
<LoadingSpinner />

// การใช้งานแบบเต็ม
<LoadingSpinner 
  size="lg" 
  text="กำลังโหลด..." 
  fullScreen 
  className="custom-class" 
/>
```

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `text`: ข้อความแสดงผล (optional)
- `fullScreen`: แสดงเต็มหน้าจอ (default: false)
- `className`: CSS class เพิ่มเติม

### 2. LoadingOverlay
```tsx
import { LoadingOverlay } from '@/components/ui/loading';

<LoadingOverlay isLoading={isLoading} text="กำลังบันทึก...">
  <YourContent />
</LoadingOverlay>
```

**Props:**
- `isLoading`: boolean - สถานะ loading
- `text`: ข้อความแสดงผล (optional)
- `children`: เนื้อหาที่จะแสดง overlay
- `className`: CSS class เพิ่มเติม

### 3. PageLoading
```tsx
import { PageLoading } from '@/components/ui/loading';

// Dashboard loading
<PageLoading type="dashboard" />

// Table loading
<PageLoading type="table" />

// Form loading
<PageLoading type="form" />

// Chart loading
<PageLoading type="chart" />

// Custom loading
<PageLoading customContent={<YourCustomSkeleton />} />
```

**Props:**
- `type`: 'dashboard' | 'table' | 'form' | 'chart' | 'custom'
- `className`: CSS class เพิ่มเติม
- `customContent`: เนื้อหา skeleton แบบกำหนดเอง

### 4. Skeleton Components
```tsx
import { Skeleton, SkeletonCard, SkeletonTable, SkeletonChart, SkeletonList } from '@/components/ui/loading';

// Basic skeleton
<Skeleton className="h-4 w-32" />

// Pre-built components
<SkeletonCard />
<SkeletonTable rows={5} columns={4} />
<SkeletonChart />
<SkeletonList items={3} />
```

## Hooks

### 1. useLoadingState
```tsx
import { useLoadingState } from '@/components/ui/loading';

const MyComponent = () => {
  const { isLoading, setLoading, withLoading, startLoading, stopLoading } = useLoadingState({
    initialLoading: false,
    delay: 300,        // หน่วงเวลา 300ms ก่อนแสดง loading
    minDuration: 500   // แสดง loading อย่างน้อย 500ms
  });

  const handleAsyncAction = async () => {
    await withLoading(async () => {
      // API call
      await fetchData();
    });
  };

  return (
    <div>
      {isLoading && <LoadingSpinner />}
      <button onClick={handleAsyncAction}>ดำเนินการ</button>
    </div>
  );
};
```

### 2. useMultipleLoadingStates
```tsx
import { useMultipleLoadingStates } from '@/components/ui/loading';

const MyComponent = () => {
  const { isLoading, withLoading, isAnyLoading } = useMultipleLoadingStates(['data', 'chart']);

  const loadData = async () => {
    await withLoading('data', async () => {
      await fetchData();
    });
  };

  const loadChart = async () => {
    await withLoading('chart', async () => {
      await fetchChart();
    });
  };

  return (
    <div>
      <div>
        {isLoading('data') ? <LoadingSpinner /> : <button onClick={loadData}>โหลดข้อมูล</button>}
      </div>
      <div>
        {isLoading('chart') ? <LoadingSpinner /> : <button onClick={loadChart}>โหลดกราฟ</button>}
      </div>
      {isAnyLoading && <p>กำลังโหลดบางอย่าง...</p>}
    </div>
  );
};
```

## Context Management

### LoadingProvider
```tsx
import { LoadingProvider } from '@/components/ui/loading';

function App() {
  return (
    <LoadingProvider>
      <YourApp />
    </LoadingProvider>
  );
}
```

### useLoadingContext
```tsx
import { useLoadingContext } from '@/components/ui/loading';

const MyComponent = () => {
  const { globalLoading, pageLoading, withGlobalLoading, withPageLoading } = useLoadingContext();

  const handleGlobalAction = async () => {
    await withGlobalLoading(async () => {
      // Global loading action
    });
  };

  return (
    <div>
      {globalLoading && <LoadingSpinner fullScreen />}
      {pageLoading && <PageLoading type="dashboard" />}
    </div>
  );
};
```

## การใช้งานในหน้าเดิม

### 1. หน้า Dashboard
```tsx
// เปลี่ยนจาก
if (leadsLoading) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-32 rounded"></div>
        ))}
      </div>
    </div>
  );
}

// เป็น
if (leadsLoading) {
  return <PageLoading type="dashboard" />;
}
```

### 2. หน้า LeadDetail
```tsx
// เปลี่ยนจาก
if (leadLoading || salesTeamLoading || latestLogLoading) {
  return (
    <div className="space-y-6 p-6">
      <div className="animate-pulse">
        <div className="bg-gray-200 h-8 w-64 rounded mb-4"></div>
        <div className="bg-gray-200 h-32 rounded"></div>
      </div>
    </div>
  );
}

// เป็น
if (leadLoading || salesTeamLoading || latestLogLoading) {
  return <PageLoading type="form" />;
}
```

### 3. หน้า Auth
```tsx
// เปลี่ยนจาก
if (loading) {
  return <LoadingSpinner />;
}

// เป็น
if (loading) {
  return <LoadingSpinner fullScreen text="กำลังโหลด..." />;
}
```

## Best Practices

### 1. ใช้ Progressive Loading
- แสดง skeleton ก่อน แล้วค่อยแสดงเนื้อหาจริง
- ใช้ delay เพื่อหลีกเลี่ยง loading flash

### 2. ใช้ Loading States ที่เหมาะสม
- **Page Loading**: สำหรับการโหลดหน้าใหม่
- **Overlay Loading**: สำหรับการบันทึกข้อมูล
- **Inline Loading**: สำหรับการโหลดข้อมูลเฉพาะส่วน

### 3. ใช้ Multiple Loading States
- แยก loading state ของแต่ละส่วน
- ใช้ `isAnyLoading` เพื่อตรวจสอบว่ามีการโหลดอยู่หรือไม่

### 4. ใช้ Context สำหรับ Global Loading
- ใช้ `globalLoading` สำหรับการโหลดที่ส่งผลต่อทั้งระบบ
- ใช้ `pageLoading` สำหรับการโหลดหน้า

### 5. ใช้ Skeleton Loading
- แสดงโครงสร้างเนื้อหาขณะโหลด
- ให้ผู้ใช้รู้ว่าข้อมูลกำลังมา

## Performance Tips

1. **ใช้ delay และ minDuration** เพื่อหลีกเลี่ยง loading flash
2. **ใช้ skeleton loading** แทน blank screen
3. **แยก loading states** เพื่อให้ผู้ใช้เห็นความคืบหน้า
4. **ใช้ context** เพื่อจัดการ global state อย่างมีประสิทธิภาพ
5. **ใช้ hooks** เพื่อลดการเขียนโค้ดซ้ำ

## ตัวอย่างการใช้งานครบถ้วน

ดูตัวอย่างการใช้งานได้ที่ `/src/examples/LoadingExamples.tsx`
