import React, { Suspense } from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';

interface PlatformBreakdownChartProps {
  platformBreakdown: { [key: string]: number };
  title: string;
  color: string;
  height?: string;
}

const PlatformBreakdownChart: React.FC<PlatformBreakdownChartProps> = ({
  platformBreakdown,
  title,
  color,
  height = '300px'
}) => {
  const total = Object.values(platformBreakdown).reduce((sum, val) => sum + val, 0);
  
  const data = Object.entries(platformBreakdown)
    .map(([platform, count]) => ({
      name: platform,
      value: count
    }))
    .sort((a, b) => b.value - a.value);

  // สี palette ที่สวยงามสำหรับแต่ละ platform
  const platformColors: { [key: string]: string } = {
    'Facebook': '#1877F2',
    'Line': '#06C755',
    'Instagram': '#E4405F',
    'Walk-in': '#8B5CF6',
    'Website': '#3B82F6',
    'โทรเข้า': '#F59E0B',
    'ไม่ระบุ': '#9CA3AF'
  };

  const option: EChartsOption = {
    title: {
      text: title,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params: any) {
        const percentage = ((params.value / total) * 100).toFixed(1);
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; color: #374151; margin-bottom: 4px;">
              ${params.name}
            </div>
            <div style="color: ${params.color}; font-size: 16px; font-weight: bold;">
              ${params.value.toLocaleString()}
            </div>
            <div style="color: #6B7280; font-size: 12px;">
              ${percentage}%
            </div>
          </div>
        `;
      }
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      textStyle: {
        fontSize: 11
      },
      itemWidth: 10,
      itemHeight: 10
    },
    series: [
      {
        name: 'Platform',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside',
          formatter: function(params: any) {
            const percentage = ((params.value / total) * 100).toFixed(1);
            return `${params.name}\n${percentage}%`;
          },
          fontSize: 11,
          fontWeight: 'bold'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 10
        },
        data: data.map(item => ({
          ...item,
          itemStyle: {
            color: platformColors[item.name] || color
          }
        }))
      }
    ]
  };

  return (
    <Suspense fallback={<div style={{ height }} className="flex items-center justify-center">กำลังโหลด...</div>}>
      <ReactECharts 
        option={option} 
        style={{ height, width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </Suspense>
  );
};

export default PlatformBreakdownChart;

