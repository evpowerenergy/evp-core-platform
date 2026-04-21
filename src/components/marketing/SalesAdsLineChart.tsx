import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { getFacebookAdsData } from "@/utils/facebookAdsUtils";
import { getGoogleAdsData } from "@/utils/googleAdsUtils";
import { getSalesDataInPeriod } from "@/utils/salesUtils";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  Calendar,
  Loader2
} from "lucide-react";

interface SalesAdsDataPoint {
  date: string;
  totalAdBudget: number;
  totalSales: number;
}

interface SalesAdsLineChartProps {
  className?: string;
}

const SalesAdsLineChart: React.FC<SalesAdsLineChartProps> = ({ className }) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    return {
      from: thirtyDaysAgo,
      to: today
    };
  });

  const [chartData, setChartData] = useState<SalesAdsDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [facebookApiConnected, setFacebookApiConnected] = useState(false);
  const [googleApiConnected, setGoogleApiConnected] = useState(false);

  // Fetch data when date range changes
  useEffect(() => {
    fetchChartData();
  }, [dateRange]);

  const fetchChartData = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    try {
      setLoading(true);
      // Clear stale data so users don't see old values while new range is loading.
      setChartData([]);
      setFacebookApiConnected(false);
      setGoogleApiConnected(false);

      // Format dates for API calls
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      const startDate = formatter.format(dateRange.from);
      const endDate = formatter.format(dateRange.to);

      // Generate date range array
      const dateArray: string[] = [];
      const currentDate = new Date(dateRange.from);
      const endDateObj = new Date(dateRange.to);

      while (currentDate <= endDateObj) {
        dateArray.push(formatter.format(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Note: We now fetch sales data for each day individually for accurate daily breakdown

      // Fetch data for each date
      let hasFacebookSuccess = false;
      let hasGoogleSuccess = false;
      const chartDataPromises = dateArray.map(async (date) => {
        const dateStart = date + 'T00:00:00.000';
        const dateEnd = date + 'T23:59:59.999';

        // Fetch Facebook Ads data
        let facebookData = null;
        try {
          facebookData = await getFacebookAdsData(date, date);
          if (facebookData) hasFacebookSuccess = true;
        } catch (error) {
          console.error('Facebook API Error for date', date, error);
        }

        // Fetch Google Ads data
        let googleData = null;
        try {
          googleData = await getGoogleAdsData(date, date, 'campaign');
          if (googleData) hasGoogleSuccess = true;
        } catch (error) {
          console.error('Google Ads API Error for date', date, error);
        }

        // Fetch daily sales data for this specific date
        let dailySalesData = null;
        try {
          dailySalesData = await getSalesDataInPeriod(dateStart, dateEnd);
        } catch (error) {
          console.error('Daily sales data error for date', date, error);
        }

        const dailySales = dailySalesData?.totalSalesValue || 0;

        const facebookSpend = facebookData?.totalSpend || 0;
        const googleSpend = googleData?.totalCost || 0;
        const totalAdBudget = facebookSpend + googleSpend;


        return {
          date: date,
          totalAdBudget: totalAdBudget,
          totalSales: dailySales
        };
      });

      const chartDataResults = await Promise.all(chartDataPromises);
      setChartData(chartDataResults);
      setFacebookApiConnected(hasFacebookSuccess);
      setGoogleApiConnected(hasGoogleSuccess);

    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      month: 'short',
      day: 'numeric'
    });
  };

  // ECharts configuration
  const getChartOption = () => {
    const dates = chartData.map(item => formatDate(item.date));
    const totalAdBudgetData = chartData.map(item => item.totalAdBudget);
    const totalSalesData = chartData.map(item => item.totalSales);

    return {
      title: {
        text: 'งบ Ads และยอดขายรายวัน',
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#374151'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#999'
          }
        },
        formatter: function (params: any) {
          let result = `<strong>${params[0].axisValue}</strong><br/>`;
          params.forEach((param: any) => {
            result += `${param.marker} ${param.seriesName}: ${formatCurrency(param.value)}<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: ['งบ Ads ทั้งหมด', 'ยอดขาย'],
        top: 40,
        textStyle: {
          fontSize: 12
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisPointer: {
          type: 'shadow'
        },
        axisLabel: {
          fontSize: 11
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'งบประมาณ (บาท)',
          position: 'left',
          axisLabel: {
            formatter: function (value: number) {
              return value >= 1000 ? (value / 1000) + 'K' : value;
            }
          }
        },
        {
          type: 'value',
          name: 'ยอดขาย (บาท)',
          position: 'right',
          axisLabel: {
            formatter: function (value: number) {
              return value >= 1000 ? (value / 1000) + 'K' : value;
            }
          }
        }
      ],
      series: [
        {
          name: 'งบ Ads ทั้งหมด',
          type: 'line',
          yAxisIndex: 0,
          data: totalAdBudgetData,
          smooth: true,
          lineStyle: {
            width: 3,
            color: '#10B981'
          },
          itemStyle: {
            color: '#10B981'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0, color: 'rgba(16, 185, 129, 0.3)'
              }, {
                offset: 1, color: 'rgba(16, 185, 129, 0.05)'
              }]
            }
          }
        },
        {
          name: 'ยอดขาย',
          type: 'line',
          yAxisIndex: 1,
          data: totalSalesData,
          smooth: true,
          lineStyle: {
            width: 3,
            color: '#8B5CF6'
          },
          itemStyle: {
            color: '#8B5CF6'
          }
        }
      ]
    };
  };

  // Calculate totals for summary
  const totalAdBudget = chartData.reduce((sum, item) => sum + item.totalAdBudget, 0);
  // Calculate total sales from daily data (sum of all daily sales)
  const totalSales = chartData.reduce((sum, item) => sum + item.totalSales, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              Sales & Ads Performance
            </CardTitle>
            <CardDescription>
              แสดงงบ Ads และยอดขายรายวัน พร้อม ROAS
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="เลือกช่วงเวลา"
            />
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                กำลังโหลด...
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* API Status Indicators */}
        <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${facebookApiConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">Facebook API: {facebookApiConnected ? 'เชื่อมต่อแล้ว' : 'ไม่เชื่อมต่อ'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${googleApiConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">Google API: {googleApiConnected ? 'เชื่อมต่อแล้ว' : 'ไม่เชื่อมต่อ'}</span>
          </div>
        </div>

        {/* Chart */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
              <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        ) : chartData.length > 0 ? (
          <ReactECharts
            option={getChartOption()}
            style={{ height: '500px', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">ไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
              <p className="text-sm text-gray-500 mt-2">กรุณาเลือกช่วงเวลาอื่น</p>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {!loading && chartData.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">งบ Ads รวม</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(totalAdBudget)}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">ยอดขายรวม</p>
              <p className="text-xl font-bold text-purple-600">
                {formatCurrency(totalSales)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesAdsLineChart;
