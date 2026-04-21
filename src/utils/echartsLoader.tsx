import { lazy } from 'react';

// ECharts wrapper สำหรับ dynamic loading
export const ReactECharts = lazy(() => import('echarts-for-react'));

// Preload function สำหรับ ECharts
export const preloadECharts = () => {
  import('echarts-for-react').catch(() => {
    console.warn('Failed to preload ECharts');
  });
};

// ECharts component with Suspense fallback
export const EChartsComponent = ({ option, ...props }: any) => {
  const LazyECharts = lazy(() => import('echarts-for-react'));
  
  return (
    <LazyECharts 
      option={option} 
      {...props}
      style={{ height: '400px', width: '100%' }}
    />
  );
};
