import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReactECharts } from '@/utils/echartsLoader.tsx';
import { Target, PieChart as PieChartIcon } from "lucide-react";

interface SaleChanceChartProps {
  saleChanceData: Array<{ name: string; value: number; color: string; percentage: number }>;
}

const SaleChanceChart = ({ saleChanceData }: SaleChanceChartProps) => {
  // Debug logging

  
  // Check if data is empty
  if (!saleChanceData || saleChanceData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <PieChartIcon className="h-12 w-12 mb-2 text-gray-400" />
        <p className="text-sm font-medium">ไม่มีข้อมูลโอกาสการขาย</p>
        <p className="text-xs text-gray-400">ในช่วงเวลาที่เลือก</p>
      </div>
    );
  }

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function(params: any) {
        const data = params.data;
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; color: #374151; margin-bottom: 4px;">${data.name}</div>
            <div style="color: #6B7280; font-size: 12px;">จำนวน: ${data.value}</div>
            <div style="color: #3B82F6; font-size: 12px;">สัดส่วน: ${data.percentage.toFixed(1)}%</div>
          </div>
        `;
      }
    },
    series: [
      {
        name: 'โอกาสการขาย',
        type: 'pie',
        radius: ['45%', '75%'], // Changed from '70%' to ['45%', '75%'] for doughnut effect
        center: ['50%', '50%'],
        data: saleChanceData.map(item => ({
          name: item.name,
          value: item.value,
          percentage: item.percentage,
          itemStyle: {
            color: item.color
          }
        })),
        label: {
          show: true,
          formatter: function(params: any) {
            return `${params.name}\n${params.value} | ${params.data.percentage.toFixed(1)}%`;
          },
          fontSize: 12,
          fontWeight: 'bold',
          color: '#374151'
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 10
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicOut'
      }
    ]
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '250px', width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
};

export default SaleChanceChart; 