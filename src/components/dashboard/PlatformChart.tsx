
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactECharts } from '@/utils/echartsLoader.tsx';

interface PlatformChartProps {
  platformData: Array<{ name: string; value: number; color: string }>;
}

const PlatformChart = ({ platformData }: PlatformChartProps) => {
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function(params: any) {
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; color: #374151; margin-bottom: 4px;">${params.name}</div>
            <div style="color: #6B7280; font-size: 12px;">จำนวน: ${params.value}</div>
            <div style="color: #3B82F6; font-size: 12px;">สัดส่วน: ${params.percent.toFixed(1)}%</div>
          </div>
        `;
      }
    },
    series: [
      {
        name: 'แหล่งที่มา',
        type: 'pie',
        radius: ['40%', '70%'], // Changed from '60%' to ['40%', '70%'] for doughnut effect
        center: ['50%', '50%'],
        data: platformData.map(item => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: item.color
          }
        })),
        label: {
          show: true,
          formatter: function(params: any) {
            return `${params.name}: ${params.value}`;
          },
          fontSize: 11,
          fontWeight: 'bold',
          color: '#374151'
        },
        labelLine: {
          show: true,
          length: 8,
          length2: 8
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
    <Card className="bg-gray-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">แหล่งที่มาของลีด</CardTitle>
      </CardHeader>
      <CardContent>
        <ReactECharts
          option={option}
          style={{ height: '200px', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </CardContent>
    </Card>
  );
};

export default PlatformChart;
