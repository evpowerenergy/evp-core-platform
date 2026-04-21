import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactECharts } from '@/utils/echartsLoader.tsx';
import { supabase } from "@/integrations/supabase/client";
import { SalesTeamMember } from "@/types/salesTeam";

interface PerformanceChartProps {
  salesTeam: SalesTeamMember[];
}

const PerformanceChart = ({ salesTeam }: PerformanceChartProps) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (salesTeam.length > 0) {
      fetchPerformanceData();
    }
  }, [salesTeam]);

  const fetchPerformanceData = async () => {
    try {
      const last6Months = [];
      const currentDate = new Date();
      const salesOwnerIds = salesTeam.map(member => member.id);
      
      // Get all closed deals for the last 6 months in one query
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1);
      const { data: closedDeals } = await supabase
        .from('leads')
        .select('sale_owner_id, updated_at_thai')
        .in('sale_owner_id', salesOwnerIds)
        .eq('status', 'ปิดการขาย')
        .gte('updated_at_thai', startDate.toISOString());

      // Generate last 6 months data
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
        
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

        const monthData: any = {
          month: monthName,
          total: 0
        };

        // Count deals for each member in this month
        salesTeam.forEach(member => {
          const memberDeals = closedDeals?.filter(deal => 
            deal.sale_owner_id === member.id &&
            new Date(deal.updated_at_thai) >= startOfMonth &&
            new Date(deal.updated_at_thai) <= endOfMonth
          ) || [];

          const dealCount = memberDeals.length;
          monthData[member.name] = dealCount;
          monthData.total += dealCount;
        });

        last6Months.push(monthData);
      }

      setChartData(last6Months);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', 
    '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
  ];

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: salesTeam.map(member => member.name),
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.map(item => item.month),
      axisLabel: {
        fontSize: 12,
        fontWeight: 'bold'
      }
    },
    yAxis: {
      type: 'value',
      name: 'จำนวนดีล',
      axisLabel: {
        fontSize: 12,
        fontWeight: 'bold'
      }
    },
    series: salesTeam.map((member, index) => ({
      name: member.name,
      type: 'bar',
      data: chartData.map(item => item[member.name] || 0),
      itemStyle: {
        color: colors[index % colors.length],
        borderRadius: [4, 4, 0, 0]
      },
      emphasis: {
        itemStyle: {
          color: colors[index % colors.length],
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    })),
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>กราฟผลงาน - ดีลปิดรายเดือน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>กราฟผลงาน - ดีลปิดรายเดือน</CardTitle>
      </CardHeader>
      <CardContent>
        <ReactECharts
          option={option}
          style={{ height: '320px', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;
