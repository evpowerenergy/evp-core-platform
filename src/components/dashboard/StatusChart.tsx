
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactECharts } from '@/utils/echartsLoader.tsx';

interface StatusChartProps {
  statusData: Array<{ name: string; value: number }>;
}

const StatusChart = ({ statusData }: StatusChartProps) => {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: statusData.map(item => item.name),
      axisLabel: {
        fontSize: 12,
        fontWeight: 'bold'
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 12,
        fontWeight: 'bold'
      }
    },
    series: [
      {
        name: 'จำนวน',
        type: 'bar',
        data: statusData.map(item => item.value),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#10B981' },
              { offset: 1, color: '#059669' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          fontSize: 12,
          fontWeight: 'bold',
          color: '#374151'
        },
        emphasis: {
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#059669' },
                { offset: 1, color: '#047857' }
              ]
            }
          }
        }
      }
    ],
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };

  return (
    <Card className="bg-gray-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">กราฟสถานะลีด</CardTitle>
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

export default StatusChart;
