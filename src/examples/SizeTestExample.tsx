import React from 'react';
import { ElectricityLoading } from '@/components/ui/loading';

export const SizeTestExample = () => {
  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold">ทดสอบขนาด Lottie Animation</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Extra Small */}
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h4 className="font-medium mb-4 text-center">Extra Small (16px)</h4>
          <div className="flex justify-center items-center h-20">
            <ElectricityLoading size="xs" />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">w-4 h-4</p>
        </div>

        {/* Small */}
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h4 className="font-medium mb-4 text-center">Small (24px)</h4>
          <div className="flex justify-center items-center h-20">
            <ElectricityLoading size="sm" />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">w-6 h-6</p>
        </div>

        {/* Medium */}
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h4 className="font-medium mb-4 text-center">Medium (32px)</h4>
          <div className="flex justify-center items-center h-20">
            <ElectricityLoading size="md" />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">w-8 h-8</p>
        </div>

        {/* Large */}
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h4 className="font-medium mb-4 text-center">Large (40px)</h4>
          <div className="flex justify-center items-center h-20">
            <ElectricityLoading size="lg" />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">w-10 h-10</p>
        </div>

        {/* Extra Large */}
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h4 className="font-medium mb-4 text-center">Extra Large (48px)</h4>
          <div className="flex justify-center items-center h-20">
            <ElectricityLoading size="xl" />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">w-12 h-12</p>
        </div>

        {/* 2XL */}
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h4 className="font-medium mb-4 text-center">2XL (64px)</h4>
          <div className="flex justify-center items-center h-20">
            <ElectricityLoading size="2xl" />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">w-16 h-16</p>
        </div>

        {/* 3XL */}
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h4 className="font-medium mb-4 text-center">3XL (80px)</h4>
          <div className="flex justify-center items-center h-20">
            <ElectricityLoading size="3xl" />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">w-20 h-20</p>
        </div>

        {/* 4XL */}
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h4 className="font-medium mb-4 text-center">4XL (96px)</h4>
          <div className="flex justify-center items-center h-24">
            <ElectricityLoading size="4xl" />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">w-24 h-24</p>
        </div>

        {/* 5XL */}
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h4 className="font-medium mb-4 text-center">5XL (128px)</h4>
          <div className="flex justify-center items-center h-32">
            <ElectricityLoading size="5xl" />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">w-32 h-32</p>
        </div>

        {/* 6XL */}
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h4 className="font-medium mb-4 text-center">6XL (160px)</h4>
          <div className="flex justify-center items-center h-40">
            <ElectricityLoading size="6xl" />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">w-40 h-40</p>
        </div>

        {/* 7XL */}
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h4 className="font-medium mb-4 text-center">7XL (192px)</h4>
          <div className="flex justify-center items-center h-48">
            <ElectricityLoading size="7xl" />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">w-48 h-48</p>
        </div>

        {/* 8XL */}
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h4 className="font-medium mb-4 text-center">8XL (224px)</h4>
          <div className="flex justify-center items-center h-56">
            <ElectricityLoading size="8xl" />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">w-56 h-56</p>
        </div>

        {/* Small Comparison */}
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h4 className="font-medium mb-4 text-center">เปรียบเทียบขนาดเล็ก</h4>
          <div className="flex justify-center items-center h-20 gap-1">
            <ElectricityLoading size="xs" />
            <ElectricityLoading size="sm" />
            <ElectricityLoading size="md" />
            <ElectricityLoading size="lg" />
            <ElectricityLoading size="xl" />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">xs → sm → md → lg → xl</p>
        </div>

        {/* Medium Comparison */}
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h4 className="font-medium mb-4 text-center">เปรียบเทียบขนาดกลาง</h4>
          <div className="flex justify-center items-center h-24 gap-1">
            <ElectricityLoading size="xl" />
            <ElectricityLoading size="2xl" />
            <ElectricityLoading size="3xl" />
            <ElectricityLoading size="4xl" />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">xl → 2xl → 3xl → 4xl</p>
        </div>

        {/* Large Comparison */}
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h4 className="font-medium mb-4 text-center">เปรียบเทียบขนาดใหญ่</h4>
          <div className="flex justify-center items-center h-32 gap-1">
            <ElectricityLoading size="4xl" />
            <ElectricityLoading size="5xl" />
            <ElectricityLoading size="6xl" />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">4xl → 5xl → 6xl</p>
        </div>

        {/* Extra Large Comparison */}
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h4 className="font-medium mb-4 text-center">เปรียบเทียบขนาดใหญ่มาก</h4>
          <div className="flex justify-center items-center h-40 gap-1">
            <ElectricityLoading size="6xl" />
            <ElectricityLoading size="7xl" />
            <ElectricityLoading size="8xl" />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">6xl → 7xl → 8xl</p>
        </div>
      </div>
    </div>
  );
};
